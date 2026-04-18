from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
import uuid

class UserManager(BaseUserManager):
    """Custom user manager that uses email as the unique identifier"""
    
    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular user with the given email and password."""
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a superuser with the given email and password."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    ROLE_CHOICES = [
        ('customer', 'Customer'),
        ('admin', 'Admin'),
        ('staff', 'Staff'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.URLField(blank=True)
    email_verified = models.BooleanField(default=False)
    reset_token = models.CharField(max_length=100, blank=True, null=True)
    
    # Remove the username field
    username = None
    
    # Make email required and unique
    email = models.EmailField(unique=True)
    
    # Set email as the USERNAME_FIELD
    USERNAME_FIELD = 'email'
    
    # Fields required when creating a user
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    # Use the custom manager
    objects = UserManager()
    
    def __str__(self):
        return self.email

class Product(models.Model):
    name = models.CharField(max_length=255, db_index=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, db_index=True)
    description = models.TextField()
    image = models.URLField()
    category = models.CharField(max_length=50, blank=True, null=True, db_index=True)
    stock = models.IntegerField(default=0, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['category', 'price']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return self.name

class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
    ]
    
    order_id = models.CharField(max_length=20, unique=True, editable=False, db_index=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders', db_index=True)
    customer_name = models.CharField(max_length=255)
    customer_email = models.EmailField(db_index=True)
    customer_phone = models.CharField(max_length=20, blank=True)
    shipping_address = models.TextField()
    city = models.CharField(max_length=100)
    postal_code = models.CharField(max_length=20, blank=True)
    
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)
    payment_method = models.CharField(max_length=50, default='paystack')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    
    transaction_ref = models.CharField(max_length=100, blank=True, null=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['order_id']),
            models.Index(fields=['user']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['customer_email']),
        ]
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        if not self.order_id:
            self.order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.order_id} - {self.customer_name}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    product_name = models.CharField(max_length=255)
    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    
    def __str__(self):
        return f"{self.product_name} x {self.quantity}"

class Coupon(models.Model):
    DISCOUNT_TYPE_CHOICES = [
        ('percentage', 'Percentage (%)'),
        ('fixed', 'Fixed Amount (KES)'),
    ]
    
    code = models.CharField(max_length=50, unique=True, db_index=True)
    discount_type = models.CharField(max_length=20, choices=DISCOUNT_TYPE_CHOICES, default='percentage')
    discount_value = models.DecimalField(max_digits=10, decimal_places=2)
    min_order_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    max_discount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    valid_from = models.DateTimeField(db_index=True)
    valid_to = models.DateTimeField(db_index=True)
    
    usage_limit = models.IntegerField(default=1)
    used_count = models.IntegerField(default=0)
    per_user_limit = models.IntegerField(default=1)
    
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['is_active', 'valid_from', 'valid_to']),
        ]
    
    def __str__(self):
        return f"{self.code} - {self.discount_value}{'%' if self.discount_type == 'percentage' else ' KES'}"
    
    @property
    def is_valid(self):
        from django.utils import timezone
        now = timezone.now()
        return (self.is_active and 
                self.valid_from <= now <= self.valid_to and 
                self.used_count < self.usage_limit)

class StoreSettings(models.Model):
    """Store configuration settings"""
    
    store_name = models.CharField(max_length=100, default='FlashCart Pro')
    store_email = models.EmailField(default='info@flashcartpro.com')
    store_phone = models.CharField(max_length=20, default='+254 700 123 456')
    store_address = models.TextField(default='Nairobi, Kenya')
    store_description = models.TextField(blank=True)
    store_logo = models.URLField(blank=True)
    
    free_shipping_threshold = models.DecimalField(max_digits=10, decimal_places=2, default=5000)
    shipping_cost = models.DecimalField(max_digits=10, decimal_places=2, default=299)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=16.00)
    
    payment_methods = models.JSONField(default=list)
    currency = models.CharField(max_length=3, default='KES')
    
    order_prefix = models.CharField(max_length=10, default='ORD')
    auto_confirm_order = models.BooleanField(default=False)
    
    send_order_confirmation = models.BooleanField(default=True)
    send_payment_confirmation = models.BooleanField(default=True)
    send_shipping_update = models.BooleanField(default=True)
    
    facebook_url = models.URLField(blank=True)
    twitter_url = models.URLField(blank=True)
    instagram_url = models.URLField(blank=True)
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Store Settings"
    
    def __str__(self):
        return self.store_name

# ==================== REVIEW MODEL ====================
class Review(models.Model):
    """Product reviews and ratings"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews', db_index=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews', db_index=True)
    rating = models.IntegerField(choices=[(1, '1 Star'), (2, '2 Stars'), (3, '3 Stars'), (4, '4 Stars'), (5, '5 Stars')], db_index=True)
    title = models.CharField(max_length=200)
    comment = models.TextField()
    verified_purchase = models.BooleanField(default=False)
    helpful_count = models.IntegerField(default=0)
    helpful_votes = models.ManyToManyField(User, related_name='helpful_reviews', blank=True)
    is_approved = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['product', 'user']
        indexes = [
            models.Index(fields=['product', 'is_approved']),
            models.Index(fields=['rating']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.product.name} - {self.rating}★"

# ==================== WISHLIST MODEL ====================
class Wishlist(models.Model):
    """User wishlist items"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wishlist', db_index=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='wishlisted_by', db_index=True)
    added_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        unique_together = ['user', 'product']
        ordering = ['-added_at']
        indexes = [
            models.Index(fields=['user', 'product']),
            models.Index(fields=['added_at']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.product.name}"