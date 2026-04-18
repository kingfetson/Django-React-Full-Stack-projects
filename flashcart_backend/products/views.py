from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.mail import send_mail
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.http import JsonResponse
from django.contrib.auth import authenticate, get_user_model
from django.utils.crypto import get_random_string
from .models import Product, Order, OrderItem, Coupon, StoreSettings, Review
from .serializers import (
    ProductSerializer, OrderSerializer, CreateOrderSerializer,
    UserSerializer, RegisterSerializer, ChangePasswordSerializer,
    ForgotPasswordSerializer, ResetPasswordSerializer, CouponSerializer,
    StoreSettingsSerializer, ReviewSerializer, WishlistSerializer
)
import requests
import json
import logging
import traceback
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from .models import Wishlist
from .serializers import WishlistSerializer

from django.core.cache import cache
from django.views.decorators.cache import cache_page
from django.views.decorators.vary import vary_on_headers
from .utils.cache_utils import CacheManager, cached

logger = logging.getLogger(__name__)

# Import Paystack libraries
try:
    from smartpaystack import SmartPaystack, ChargeStrategy, Currency
    from smartpaystack import WebhookVerifier
    from smartpaystack.exceptions import WebhookVerificationError
except ImportError:
    print("Warning: smartpaystack not installed. Run: pip install smartpaystack")

User = get_user_model()

# Initialize Paystack client
paystack_client = None
if hasattr(settings, 'PAYSTACK_SECRET_KEY') and settings.PAYSTACK_SECRET_KEY:
    try:
        paystack_client = SmartPaystack(secret_key=settings.PAYSTACK_SECRET_KEY)
    except Exception as e:
        print(f"Error initializing Paystack: {e}")

# ==================== AUTHENTICATION VIEWS ====================

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    print("REGISTRATION REQUEST:", request.data.get('email'))
    
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        # Send verification email
        verification_token = get_random_string(64)
        user.reset_token = verification_token
        user.save()
        
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        verification_link = f"{frontend_url}/verify-email?token={verification_token}"
        
        try:
            send_mail(
                'Verify Your Email - FlashCart Pro',
                f'Click the link to verify your email: {verification_link}',
                getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@flashcartpro.com'),
                [user.email],
                fail_silently=True,
            )
        except Exception as e:
            print(f"Email error: {e}")
        
        return Response({
            'success': True,
            'message': 'User created successfully. Please verify your email.',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    
    return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    email = request.data.get('email')
    password = request.data.get('password')
    
    user = authenticate(request, username=email, password=password)
    
    if user is not None:
        refresh = RefreshToken.for_user(user)
        return Response({
            'success': True,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        })
    
    return Response({
        'success': False,
        'error': 'Invalid credentials'
    }, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        refresh_token = request.data.get('refresh')
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({'success': True, 'message': 'Logged out successfully'})
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=400)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profile(request):
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_profile(request):
    user = request.user
    user.first_name = request.data.get('first_name', user.first_name)
    user.last_name = request.data.get('last_name', user.last_name)
    user.phone = request.data.get('phone', user.phone)
    user.save()
    
    serializer = UserSerializer(user)
    return Response({'success': True, 'user': serializer.data})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    serializer = ChangePasswordSerializer(data=request.data)
    if serializer.is_valid():
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'success': False, 'error': 'Wrong password'}, status=400)
        
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'success': True, 'message': 'Password changed successfully'})
    
    return Response({'success': False, 'errors': serializer.errors}, status=400)

@api_view(['POST'])
@permission_classes([AllowAny])
def forgot_password(request):
    serializer = ForgotPasswordSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        try:
            user = User.objects.get(email=email)
            reset_token = get_random_string(64)
            user.reset_token = reset_token
            user.save()
            
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            reset_link = f"{frontend_url}/reset-password?token={reset_token}"
            
            send_mail(
                'Reset Your Password - FlashCart Pro',
                f'Click the link to reset your password: {reset_link}',
                getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@flashcartpro.com'),
                [email],
                fail_silently=True,
            )
        except User.DoesNotExist:
            pass
        
        return Response({'success': True, 'message': 'Reset link sent to your email'})
    
    return Response({'success': False, 'errors': serializer.errors}, status=400)

@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password(request):
    serializer = ResetPasswordSerializer(data=request.data)
    if serializer.is_valid():
        token = serializer.validated_data['token']
        try:
            user = User.objects.get(reset_token=token)
            user.set_password(serializer.validated_data['new_password'])
            user.reset_token = None
            user.save()
            return Response({'success': True, 'message': 'Password reset successfully'})
        except User.DoesNotExist:
            return Response({'success': False, 'error': 'Invalid token'}, status=400)
    
    return Response({'success': False, 'errors': serializer.errors}, status=400)

@api_view(['GET'])
@permission_classes([AllowAny])
def verify_email(request):
    token = request.query_params.get('token')
    try:
        user = User.objects.get(reset_token=token)
        user.email_verified = True
        user.reset_token = None
        user.save()
        return Response({'success': True, 'message': 'Email verified successfully'})
    except User.DoesNotExist:
        return Response({'success': False, 'error': 'Invalid token'}, status=400)

# ==================== PRODUCT VIEWS ====================

@api_view(['GET'])
@permission_classes([AllowAny])
def get_products(request):
    products = Product.objects.all()
    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_product(request):
    """Create a new product (admin only)"""
    if request.user.role != 'admin' and not request.user.is_superuser:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    serializer = ProductSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(created_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def product_detail(request, product_id):
    """Get, update or delete a specific product"""
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Only admin can modify products
    if request.method in ['PUT', 'DELETE']:
        if request.user.role != 'admin' and not request.user.is_superuser:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        serializer = ProductSerializer(product)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = ProductSerializer(product, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        product.delete()
        return Response({'message': 'Product deleted successfully'}, status=status.HTTP_204_NO_CONTENT)

# ==================== REVIEW VIEWS ====================

@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
def product_reviews(request, product_id):
    """Get all reviews for a product or create a new review"""
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        reviews = product.reviews.filter(is_approved=True)
        serializer = ReviewSerializer(reviews, many=True, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'POST':
        if not request.user.is_authenticated:
            return Response({'error': 'Please login to leave a review'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Check if user already reviewed this product
        if Review.objects.filter(product=product, user=request.user).exists():
            return Response({'error': 'You have already reviewed this product'}, status=status.HTTP_400_BAD_REQUEST)
        
        data = request.data.copy()
        data['product'] = product.id
        data['user'] = request.user.id
        
        serializer = ReviewSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def review_detail(request, review_id):
    """Update or delete a review (owner only)"""
    try:
        review = Review.objects.get(id=review_id)
    except Review.DoesNotExist:
        return Response({'error': 'Review not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Check if user is the owner or admin
    if review.user != request.user and request.user.role != 'admin':
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'PUT':
        serializer = ReviewSerializer(review, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        review.delete()
        return Response({'message': 'Review deleted successfully'}, status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def helpful_review(request, review_id):
    """Mark a review as helpful"""
    try:
        review = Review.objects.get(id=review_id)
    except Review.DoesNotExist:
        return Response({'error': 'Review not found'}, status=status.HTTP_404_NOT_FOUND)
    
    user = request.user
    
    if user in review.helpful_votes.all():
        # Remove helpful vote
        review.helpful_votes.remove(user)
        review.helpful_count -= 1
        review.save()
        return Response({'helpful': False, 'count': review.helpful_count})
    else:
        # Add helpful vote
        review.helpful_votes.add(user)
        review.helpful_count += 1
        review.save()
        return Response({'helpful': True, 'count': review.helpful_count})

@api_view(['GET'])
@permission_classes([AllowAny])
def product_rating_summary(request, product_id):
    """Get rating summary for a product"""
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
    
    reviews = product.reviews.filter(is_approved=True)
    total_reviews = reviews.count()
    
    if total_reviews == 0:
        return Response({
            'average_rating': 0,
            'total_reviews': 0,
            'rating_distribution': {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        })
    
    average_rating = sum([r.rating for r in reviews]) / total_reviews
    
    rating_distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for review in reviews:
        rating_distribution[review.rating] += 1
    
    return Response({
        'average_rating': round(average_rating, 1),
        'total_reviews': total_reviews,
        'rating_distribution': rating_distribution
    })

# ==================== ORDER VIEWS ====================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_order(request):
    serializer = CreateOrderSerializer(data=request.data)
    
    if serializer.is_valid():
        try:
            # Create order with user association
            order = Order.objects.create(
                user=request.user,
                customer_name=serializer.validated_data['customer_name'],
                customer_email=serializer.validated_data['customer_email'],
                customer_phone=serializer.validated_data.get('customer_phone', ''),
                shipping_address=serializer.validated_data['shipping_address'],
                city=serializer.validated_data['city'],
                postal_code=serializer.validated_data.get('postal_code', ''),
                payment_method=serializer.validated_data.get('payment_method', 'paystack'),
                notes=serializer.validated_data.get('notes', ''),
                total_amount=0
            )
            
            total_amount = 0
            
            for item_data in serializer.validated_data['items']:
                product = Product.objects.get(id=item_data['product_id'])
                quantity = item_data['quantity']
                price = float(item_data['price'])
                
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    product_name=product.name,
                    quantity=quantity,
                    price=price
                )
                
                total_amount += price * quantity
                product.stock -= quantity
                product.save()
            
            order.total_amount = total_amount
            order.save()
            
            order_serializer = OrderSerializer(order)
            return Response({
                'success': True,
                'order_id': order.order_id,
                'order': order_serializer.data,
                'message': 'Order created successfully'
            }, status=status.HTTP_201_CREATED)
            
        except Product.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Product not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response({
        'success': False,
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_orders(request):
    """Get orders for the authenticated user"""
    user = request.user
    
    # Admin users can see all orders, regular users see only their own
    if user.role == 'admin' or user.is_superuser:
        orders = Order.objects.all().order_by('-created_at')
    else:
        orders = Order.objects.filter(user=user).order_by('-created_at')
    
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_order_detail(request, order_id):
    try:
        order = Order.objects.get(order_id=order_id)
        
        # Check if user has permission to view this order
        if request.user.role != 'admin' and not request.user.is_superuser and order.user != request.user:
            return Response({
                'error': 'Permission denied'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = OrderSerializer(order)
        return Response(serializer.data)
    except Order.DoesNotExist:
        return Response({
            'error': 'Order not found'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_order_status(request, order_id):
    # Only admin or staff can update order status
    if request.user.role not in ['admin', 'staff'] and not request.user.is_superuser:
        return Response({
            'error': 'Permission denied'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        order = Order.objects.get(order_id=order_id)
        new_status = request.data.get('status')
        
        if new_status in dict(Order.STATUS_CHOICES):
            order.status = new_status
            order.save()
            
            serializer = OrderSerializer(order)
            return Response({
                'success': True,
                'order': serializer.data
            })
        else:
            return Response({
                'error': 'Invalid status'
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Order.DoesNotExist:
        return Response({
            'error': 'Order not found'
        }, status=status.HTTP_404_NOT_FOUND)

# ==================== PAYMENT VIEWS ====================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initialize_payment(request):
    """Initialize a Paystack transaction for an order"""
    if not paystack_client:
        return Response({
            'error': 'Paystack not configured.'
        }, status=500)
    
    try:
        order_id = request.data.get('order_id')
        order = Order.objects.get(order_id=order_id)
        
        # Verify the order belongs to the user
        if order.user != request.user and request.user.role != 'admin':
            return Response({'error': 'Permission denied'}, status=403)
        
        response = paystack_client.create_charge(
            email=order.customer_email,
            amount=int(order.total_amount),
            currency=Currency.KES,
            charge_strategy=ChargeStrategy.PASS,
            metadata={
                "order_id": order.order_id,
                "customer_name": order.customer_name,
            }
        )
        
        order.transaction_ref = response.get('reference')
        order.save()
        
        return Response({
            'success': True,
            'authorization_url': response['authorization_url'],
            'reference': response.get('reference'),
        })
        
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=400)

@api_view(['GET'])
@permission_classes([AllowAny])
def verify_payment(request):
    try:
        reference = request.query_params.get('reference')
        
        if not reference:
            return Response({'error': 'Reference required'}, status=400)
        
        headers = {
            'Authorization': f'Bearer {settings.PAYSTACK_SECRET_KEY}',
            'Content-Type': 'application/json'
        }
        response = requests.get(
            f'https://api.paystack.co/transaction/verify/{reference}',
            headers=headers
        )
        
        result = response.json()
        
        if result['status'] and result['data']['status'] == 'success':
            order = Order.objects.get(transaction_ref=reference)
            order.status = 'processing'
            order.payment_status = 'paid'
            order.save()
            
            return Response({
                'success': True,
                'status': 'verified',
                'order_id': order.order_id
            })
        
        return Response({'success': False, 'status': 'verification_failed'})
        
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=400)

@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
    try:
        serializer = TokenRefreshSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)
    except InvalidToken as e:
        return Response({'error': str(e)}, status=status.HTTP_401_UNAUTHORIZED)

@csrf_exempt
@require_POST
def paystack_webhook(request):
    signature = request.headers.get('x-paystack-signature', '')
    raw_body = request.body
    
    verifier = WebhookVerifier(secret_key=settings.PAYSTACK_SECRET_KEY)
    
    try:
        event_data = verifier.verify_and_parse(raw_body, signature)
    except WebhookVerificationError as e:
        return JsonResponse({'error': str(e)}, status=400)
    
    if event_data['event'] == 'charge.success':
        data = event_data['data']
        metadata = data.get('metadata', {})
        order_id = metadata.get('order_id')
        
        if order_id:
            try:
                order = Order.objects.get(order_id=order_id)
                order.status = 'processing'
                order.payment_status = 'paid'
                order.transaction_ref = data.get('reference')
                order.save()
                print(f"Payment successful for Order {order_id}!")
            except Order.DoesNotExist:
                print(f"Order {order_id} not found")
    
    return JsonResponse({'status': 'success'}, status=200)

# ==================== USER MANAGEMENT VIEWS ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_users(request):
    """Get all users (admin only)"""
    if request.user.role != 'admin' and not request.user.is_superuser:
        return Response({
            'error': 'Permission denied'
        }, status=status.HTTP_403_FORBIDDEN)
    
    users = User.objects.all()
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_top_products(request):
    """Get top selling products (admin only)"""
    if request.user.role != 'admin' and not request.user.is_superuser:
        return Response({'error': 'Permission denied'}, status=403)
    
    from django.db.models import Sum, F
    top_products = OrderItem.objects.values('product_name').annotate(
        total_quantity=Sum('quantity'),
        total_revenue=Sum(F('quantity') * F('price'))
    ).order_by('-total_quantity')[:10]
    
    return Response(top_products)

# ==================== COUPON VIEWS ====================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def coupons(request):
    """Get all coupons or create a new coupon (admin only)"""
    if request.user.role != 'admin' and not request.user.is_superuser:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        coupons = Coupon.objects.all()
        serializer = CouponSerializer(coupons, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = CouponSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def coupon_detail(request, coupon_id):
    """Get, update or delete a specific coupon (admin only)"""
    if request.user.role != 'admin' and not request.user.is_superuser:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        coupon = Coupon.objects.get(id=coupon_id)
    except Coupon.DoesNotExist:
        return Response({'error': 'Coupon not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = CouponSerializer(coupon)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = CouponSerializer(coupon, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        coupon.delete()
        return Response({'message': 'Coupon deleted successfully'}, status=status.HTTP_204_NO_CONTENT)

@api_view(['POST'])
@permission_classes([AllowAny])
def validate_coupon(request):
    """Validate a coupon code (public endpoint)"""
    code = request.data.get('code', '').upper()
    order_total = float(request.data.get('order_total', 0))
    
    try:
        coupon = Coupon.objects.get(code=code, is_active=True)
    except Coupon.DoesNotExist:
        return Response({'valid': False, 'error': 'Invalid coupon code'}, status=status.HTTP_404_NOT_FOUND)
    
    # Check validity
    from django.utils import timezone
    now = timezone.now()
    
    if not coupon.is_active:
        return Response({'valid': False, 'error': 'Coupon is inactive'})
    
    if coupon.valid_from > now:
        return Response({'valid': False, 'error': f'Coupon valid from {coupon.valid_from.strftime("%Y-%m-%d")}'})
    
    if coupon.valid_to < now:
        return Response({'valid': False, 'error': 'Coupon has expired'})
    
    if coupon.used_count >= coupon.usage_limit:
        return Response({'valid': False, 'error': 'Coupon usage limit reached'})
    
    if order_total < coupon.min_order_amount:
        return Response({'valid': False, 'error': f'Minimum order amount of KES {coupon.min_order_amount} required'})
    
    # Calculate discount
    if coupon.discount_type == 'percentage':
        discount = (coupon.discount_value / 100) * order_total
        if coupon.max_discount:
            discount = min(discount, coupon.max_discount)
    else:
        discount = min(coupon.discount_value, order_total)
    
    return Response({
        'valid': True,
        'code': coupon.code,
        'discount_type': coupon.discount_type,
        'discount_value': coupon.discount_value,
        'discount_amount': round(discount, 2),
        'message': f'Coupon applied! You saved KES {round(discount, 2)}'
    })

# ==================== SETTINGS VIEWS ====================

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def store_settings(request):
    """Get or update store settings (admin only)"""
    if request.user.role != 'admin' and not request.user.is_superuser:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
 # ==================== WISHLIST VIEWS ====================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def wishlist(request):
    """Get user's wishlist or add item to wishlist"""
    user = request.user
    
    if request.method == 'GET':
        wishlist_items = Wishlist.objects.filter(user=user)
        serializer = WishlistSerializer(wishlist_items, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        product_id = request.data.get('product_id')
        
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Check if already in wishlist
        if Wishlist.objects.filter(user=user, product=product).exists():
            return Response({'error': 'Product already in wishlist'}, status=status.HTTP_400_BAD_REQUEST)
        
        wishlist_item = Wishlist.objects.create(user=user, product=product)
        serializer = WishlistSerializer(wishlist_item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def wishlist_remove(request, product_id):
    """Remove item from wishlist"""
    user = request.user
    
    try:
        wishlist_item = Wishlist.objects.get(user=user, product_id=product_id)
        wishlist_item.delete()
        return Response({'message': 'Item removed from wishlist'}, status=status.HTTP_204_NO_CONTENT)
    except Wishlist.DoesNotExist:
        return Response({'error': 'Item not found in wishlist'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_wishlist(request, product_id):
    """Toggle product in wishlist (add if not exists, remove if exists)"""
    user = request.user
    
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
    
    wishlist_item = Wishlist.objects.filter(user=user, product=product)
    
    if wishlist_item.exists():
        wishlist_item.delete()
        return Response({'added': False, 'message': 'Removed from wishlist'})
    else:
        Wishlist.objects.create(user=user, product=product)
        return Response({'added': True, 'message': 'Added to wishlist'})   
    # Get or create settings
    settings_obj, created = StoreSettings.objects.get_or_create(id=1)
    
    if request.method == 'GET':
        serializer = StoreSettingsSerializer(settings_obj)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = StoreSettingsSerializer(settings_obj, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
   
# Cache products list for 1 hour
@api_view(['GET'])
@permission_classes([AllowAny])
@cache_page(60 * 60)  # Cache for 1 hour
@vary_on_headers('Authorization')  # Vary cache for different users
def get_products(request):
    # Try to get from cache
    cache_key = f"products:list:{request.GET.get('category', 'all')}:{request.GET.get('page', 1)}"
    products = cache.get(cache_key)
    
    if products is None:
        products = Product.objects.all()
        serializer = ProductSerializer(products, many=True)
        products = serializer.data
        cache.set(cache_key, products, 60 * 60)  # Cache for 1 hour
    
    return Response(products)

# Invalidate cache when product is created/updated/deleted
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_product(request):
    if request.user.role != 'admin' and not request.user.is_superuser:
        return Response({'error': 'Permission denied'}, status=403)
    
    serializer = ProductSerializer(data=request.data)
    if serializer.is_valid():
        product = serializer.save(created_by=request.user)
        # Invalidate products cache
        cache.delete_pattern("products:*")
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def product_detail(request, product_id):
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=404)
    
    if request.method == 'PUT':
        if request.user.role != 'admin' and not request.user.is_superuser:
            return Response({'error': 'Permission denied'}, status=403)
        
        serializer = ProductSerializer(product, data=request.data)
        if serializer.is_valid():
            serializer.save()
            # Invalidate specific product cache
            cache.delete(f"product:{product_id}")
            cache.delete_pattern("products:*")
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_orders(request):
    user = request.user
    
    if user.role == 'admin' or user.is_superuser:
        # Use select_related to reduce queries
        orders = Order.objects.select_related('user').prefetch_related(
            'items', 'items__product'
        ).all().order_by('-created_at')
    else:
        orders = Order.objects.select_related('user').prefetch_related(
            'items', 'items__product'
        ).filter(user=user).order_by('-created_at')
    
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_products(request):
    # Add pagination for large datasets
    from django.core.paginator import Paginator
    
    products = Product.objects.all().order_by('-created_at')
    
    # Pagination
    page = request.GET.get('page', 1)
    page_size = request.GET.get('page_size', 20)
    
    paginator = Paginator(products, page_size)
    try:
        page_products = paginator.page(page)
    except:
        page_products = paginator.page(1)
    
    serializer = ProductSerializer(page_products, many=True)
    
    return Response({
        'products': serializer.data,
        'total': paginator.count,
        'page': int(page),
        'total_pages': paginator.num_pages,
        'has_next': page_products.has_next(),
        'has_previous': page_products.has_previous(),
    })