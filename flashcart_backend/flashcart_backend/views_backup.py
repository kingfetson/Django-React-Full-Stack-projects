from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core import serializers
import json

# Import your models - adjust the import based on your app name
try:
    from products.models import Product, Order, OrderItem
except ImportError:
    from products.models import Product, Order, OrderItem  # Change to your app name

@csrf_exempt
@require_http_methods(["GET"])
def get_products(request):
    products = Product.objects.all().values('id', 'name', 'price', 'description', 'image', 'category', 'stock')
    return JsonResponse(list(products), safe=False)

@csrf_exempt
@require_http_methods(["POST"])
def create_order(request):
    try:
        data = json.loads(request.body)
        print("Received order data:", data)
        
        # Create order
        order = Order.objects.create(
            customer_name=data['customer_name'],
            customer_email=data['customer_email'],
            customer_phone=data.get('customer_phone', ''),
            shipping_address=data['shipping_address'],
            city=data['city'],
            postal_code=data.get('postal_code', ''),
            payment_method=data.get('payment_method', 'cash_on_delivery'),
            notes=data.get('notes', ''),
            total_amount=0
        )
        
        total_amount = 0
        
        # Create order items
        for item in data['items']:
            product = Product.objects.get(id=item['product_id'])
            OrderItem.objects.create(
                order=order,
                product=product,
                product_name=product.name,
                quantity=item['quantity'],
                price=item['price']
            )
            total_amount += float(item['price']) * item['quantity']
            
            # Update stock if you have stock field
            if hasattr(product, 'stock'):
                product.stock -= item['quantity']
                product.save()
        
        # Update order total
        order.total_amount = total_amount
        order.save()
        
        return JsonResponse({
            'success': True,
            'order_id': order.order_id,
            'message': 'Order placed successfully'
        })
        
    except Product.DoesNotExist:
        return JsonResponse({
            'success': False,
            'error': 'Product not found'
        }, status=404)
    except Exception as e:
        print("Order creation error:", str(e))
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)

@csrf_exempt
@require_http_methods(["GET"])
def get_orders(request):
    orders = Order.objects.all().values('order_id', 'customer_name', 'total_amount', 'status', 'created_at')
    return JsonResponse(list(orders), safe=False)

@csrf_exempt
@require_http_methods(["GET"])
def get_order_detail(request, order_id):
    try:
        order = Order.objects.get(order_id=order_id)
        order_data = {
            'order_id': order.order_id,
            'customer_name': order.customer_name,
            'customer_email': order.customer_email,
            'customer_phone': order.customer_phone,
            'shipping_address': order.shipping_address,
            'city': order.city,
            'postal_code': order.postal_code,
            'total_amount': order.total_amount,
            'status': order.status,
            'payment_method': order.payment_method,
            'created_at': order.created_at,
            'items': []
        }
        
        for item in order.items.all():
            order_data['items'].append({
                'product_name': item.product_name,
                'quantity': item.quantity,
                'price': item.price
            })
        
        return JsonResponse(order_data)
    except Order.DoesNotExist:
        return JsonResponse({'error': 'Order not found'}, status=404)

@csrf_exempt
@require_http_methods(["PUT"])
def update_order_status(request, order_id):
    try:
        data = json.loads(request.body)
        order = Order.objects.get(order_id=order_id)
        order.status = data.get('status', order.status)
        order.save()
        
        return JsonResponse({
            'success': True,
            'order_id': order.order_id,
            'status': order.status
        })
    except Order.DoesNotExist:
        return JsonResponse({'error': 'Order not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)