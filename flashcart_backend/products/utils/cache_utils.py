from django.core.cache import cache
from django.conf import settings
import hashlib
import json

class CacheManager:
    """Manage caching for different data types"""
    
    @staticmethod
    def get_cache_key(prefix, identifier):
        """Generate a consistent cache key"""
        return f"{prefix}:{identifier}"
    
    @staticmethod
    def get_or_set(key, callback, timeout=None):
        """Get from cache or set if not exists"""
        value = cache.get(key)
        if value is None:
            value = callback()
            cache.set(key, value, timeout or settings.CACHE_TTL.get('products', 3600))
        return value
    
    @staticmethod
    def invalidate_pattern(pattern):
        """Invalidate all cache keys matching pattern"""
        cache.delete_pattern(pattern)
    
    @staticmethod
    def clear_product_cache(product_id=None):
        """Clear product-related cache"""
        if product_id:
            cache.delete(f"product:{product_id}")
        cache.delete_pattern("products:list:*")
        cache.delete_pattern("products:category:*")

# Cache decorator
def cached(timeout=None, key_prefix=''):
    def decorator(func):
        def wrapper(*args, **kwargs):
            # Generate cache key from function name and arguments
            key_parts = [key_prefix or func.__name__]
            key_parts.extend(str(arg) for arg in args)
            key_parts.extend(f"{k}:{v}" for k, v in kwargs.items())
            cache_key = hashlib.md5(':'.join(key_parts).encode()).hexdigest()
            
            result = cache.get(cache_key)
            if result is None:
                result = func(*args, **kwargs)
                cache.set(cache_key, result, timeout)
            return result
        return wrapper
    return decorator