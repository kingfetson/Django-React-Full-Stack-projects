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
from .models import Product, Order, OrderItem
from .serializers import (
    ProductSerializer, OrderSerializer, CreateOrderSerializer,
    UserSerializer, RegisterSerializer, ChangePasswordSerializer,
    ForgotPasswordSerializer, ResetPasswordSerializer
)
import requests
import json
import logging
import traceback
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.serializers import TokenRefreshSerializer


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

# ==================== ORDER VIEWS ====================

@api_view(['POST'])
@permission_classes([IsAuthenticated])  # Changed from AllowAny to IsAuthenticated
def create_order(request):
    serializer = CreateOrderSerializer(data=request.data)
    
    if serializer.is_valid():
        try:
            # Create order with user association
            order = Order.objects.create(
                user=request.user,  # Associate with logged-in user
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
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_users(request):
    """Get all users (admin only)"""
    # Only admin can access this
    if request.user.role != 'admin' and not request.user.is_superuser:
        return Response({
            'error': 'Permission denied'
        }, status=status.HTTP_403_FORBIDDEN)
    
    users = User.objects.all()
    serializer = UserSerializer(users, many=True)
    return Response(serializer.data)