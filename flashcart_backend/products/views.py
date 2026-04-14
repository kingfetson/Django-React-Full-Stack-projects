from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import send_mail
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.http import JsonResponse
from .models import Product, Order, OrderItem
from .serializers import ProductSerializer, OrderSerializer, CreateOrderSerializer
import requests
import json

# Import Paystack libraries
try:
    from smartpaystack import SmartPaystack, ChargeStrategy, Currency
    from smartpaystack import WebhookVerifier
    from smartpaystack.exceptions import WebhookVerificationError
except ImportError:
    print("Warning: smartpaystack not installed. Run: pip install smartpaystack")

# Initialize Paystack client (only if PAYSTACK_SECRET_KEY is set)
paystack_client = None
if hasattr(settings, 'PAYSTACK_SECRET_KEY') and settings.PAYSTACK_SECRET_KEY:
    try:
        paystack_client = SmartPaystack(secret_key=settings.PAYSTACK_SECRET_KEY)
    except Exception as e:
        print(f"Error initializing Paystack: {e}")

@api_view(['GET'])
def get_products(request):
    products = Product.objects.all()
    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)

@api_view(['POST'])
def create_order(request):
    serializer = CreateOrderSerializer(data=request.data)
    
    if serializer.is_valid():
        try:
            # Create order
            order = Order.objects.create(
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
            
            # Create order items
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
                
                # Update stock
                product.stock -= quantity
                product.save()
            
            # Update order total
            order.total_amount = total_amount
            order.save()
            
            # Return order details
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

@api_view(['POST'])
def initialize_payment(request):
    """Initialize a Paystack transaction for an order"""
    if not paystack_client:
        return Response({
            'error': 'Paystack not configured. Please set PAYSTACK_SECRET_KEY in settings.'
        }, status=500)
    
    try:
        order_id = request.data.get('order_id')
        order = Order.objects.get(order_id=order_id)
        
        # Use SmartPaystack to create charge with automatic fee calculation
        response = paystack_client.create_charge(
            email=order.customer_email,
            amount=int(order.total_amount),  # Pass native amount, no conversion needed
            currency=Currency.KES,
            charge_strategy=ChargeStrategy.PASS,  # Customer pays the fee
            metadata={
                "order_id": order.order_id,
                "customer_name": order.customer_name,
                "custom_order_id": order_id
            }
        )
        
        # Update order with transaction reference
        order.transaction_ref = response.get('reference')
        order.save()
        
        return Response({
            'success': True,
            'authorization_url': response['authorization_url'],
            'reference': response.get('reference'),
            'access_code': response.get('access_code')
        })
        
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=400)

@api_view(['GET'])
def verify_payment(request):
    """Verify a Paystack transaction"""
    try:
        reference = request.query_params.get('reference')
        
        if not reference:
            return Response({'error': 'Reference parameter required'}, status=400)
        
        # Use Paystack API to verify transaction
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
            # Update order status
            order = Order.objects.get(transaction_ref=reference)
            order.status = 'processing'
            order.payment_status = 'paid'
            order.save()
            
            # Send confirmation email
            try:
                send_mail(
                    f'Payment Confirmed - Order {order.order_id}',
                    f'Your payment of KES {order.total_amount} has been confirmed. Your order is now being processed.',
                    settings.DEFAULT_FROM_EMAIL,
                    [order.customer_email],
                    fail_silently=True,
                )
            except:
                pass
            
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

@csrf_exempt
@require_POST
def paystack_webhook(request):
    """Handle Paystack webhook events"""
    signature = request.headers.get('x-paystack-signature', '')
    raw_body = request.body
    
    verifier = WebhookVerifier(secret_key=settings.PAYSTACK_SECRET_KEY)
    
    try:
        event_data = verifier.verify_and_parse(raw_body, signature)
    except WebhookVerificationError as e:
        return JsonResponse({'error': str(e)}, status=400)
    
    # Handle different event types
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
                
                print(f"Payment successful for Order {order_id}! Amount: {data['amount'] / 100}")
            except Order.DoesNotExist:
                print(f"Order {order_id} not found")
    
    elif event_data['event'] == 'charge.failed':
        print(f"Payment failed: {event_data['data']}")
    
    return JsonResponse({'status': 'success'}, status=200)

@api_view(['GET'])
def get_orders(request):
    """Get orders - can filter by customer email"""
    customer_email = request.query_params.get('email')
    if customer_email:
        orders = Order.objects.filter(customer_email=customer_email).order_by('-created_at')
    else:
        orders = Order.objects.all().order_by('-created_at')
    serializer = OrderSerializer(orders, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_order_detail(request, order_id):
    try:
        order = Order.objects.get(order_id=order_id)
        serializer = OrderSerializer(order)
        return Response(serializer.data)
    except Order.DoesNotExist:
        return Response({
            'error': 'Order not found'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['PUT'])
def update_order_status(request, order_id):
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