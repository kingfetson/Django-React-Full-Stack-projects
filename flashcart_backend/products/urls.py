from django.urls import path
from . import views

urlpatterns = [
    # Product endpoints
    path('products/', views.get_products, name='get-products'),
    
    # Order endpoints
    path('create-order/', views.create_order, name='create-order'),
    path('orders/', views.get_orders, name='get-orders'),
    path('orders/<str:order_id>/', views.get_order_detail, name='order-detail'),
    path('orders/<str:order_id>/status/', views.update_order_status, name='update-status'),
    
    # Paystack payment endpoints
    path('initialize-payment/', views.initialize_payment, name='initialize-payment'),
    path('verify-payment/', views.verify_payment, name='verify-payment'),
    path('paystack-webhook/', views.paystack_webhook, name='paystack-webhook'),
]