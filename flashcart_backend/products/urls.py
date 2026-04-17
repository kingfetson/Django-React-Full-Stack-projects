from django.urls import path
from . import views

urlpatterns = [
    # Authentication endpoints
    path('auth/register/', views.register, name='register'),
    path('auth/login/', views.login, name='login'),
    path('auth/logout/', views.logout, name='logout'),
    path('auth/refresh/', views.refresh_token, name='refresh-token'),
    path('auth/profile/', views.get_profile, name='profile'),
    path('auth/profile/update/', views.update_profile, name='update-profile'),
    path('auth/change-password/', views.change_password, name='change-password'),
    path('auth/forgot-password/', views.forgot_password, name='forgot-password'),
    path('auth/reset-password/', views.reset_password, name='reset-password'),
    path('auth/verify-email/', views.verify_email, name='verify-email'),
    
    # Product endpoints
    path('products/', views.get_products, name='get-products'),
    
    # Order endpoints
    path('create-order/', views.create_order, name='create-order'),
    path('orders/', views.get_orders, name='get-orders'),
    path('orders/<str:order_id>/', views.get_order_detail, name='order-detail'),
    path('orders/<str:order_id>/status/', views.update_order_status, name='update-status'),
    
    # User management endpoint (admin only)
    path('users/', views.get_users, name='get-users'),  # Add this line
    
    # Paystack payment endpoints
    path('initialize-payment/', views.initialize_payment, name='initialize-payment'),
    path('verify-payment/', views.verify_payment, name='verify-payment'),
    path('paystack-webhook/', views.paystack_webhook, name='paystack-webhook'),
]