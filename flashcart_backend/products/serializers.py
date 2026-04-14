from rest_framework import serializers
from .models import Product, Order, OrderItem

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'price', 'description', 'image', 'category', 'stock', 'created_at']

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(read_only=True)
    product_id = serializers.IntegerField(source='product.id', read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_id', 'product_name', 'quantity', 'price']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Order
        fields = ['id', 'order_id', 'customer_name', 'customer_email', 'customer_phone',
                  'shipping_address', 'city', 'postal_code', 'total_amount', 'status',
                  'payment_method', 'payment_status', 'notes', 'created_at', 'updated_at', 'items']
        read_only_fields = ['order_id', 'created_at', 'updated_at']

class CreateOrderSerializer(serializers.Serializer):
    customer_name = serializers.CharField(max_length=255)
    customer_email = serializers.EmailField()
    customer_phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    shipping_address = serializers.CharField()
    city = serializers.CharField(max_length=100)
    postal_code = serializers.CharField(max_length=20, required=False, allow_blank=True)
    payment_method = serializers.CharField(default='cash_on_delivery')
    notes = serializers.CharField(required=False, allow_blank=True)
    items = serializers.ListField(
        child=serializers.DictField(),
        write_only=True
    )