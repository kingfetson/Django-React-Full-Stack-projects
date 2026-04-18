import cloudinary.uploader
import cloudinary.utils
from django.core.files.base import ContentFile
import requests
from io import BytesIO

class ImageOptimizer:
    """Optimize and serve images through CDN"""
    
    @staticmethod
    def get_optimized_url(image_url, width=400, height=300, quality=80):
        """Generate Cloudinary URL with optimizations"""
        if not image_url:
            return None
        
        # If using Cloudinary, transform the URL
        if 'cloudinary' in image_url:
            return cloudinary.utils.cloudinary_url(
                image_url,
                width=width,
                height=height,
                crop='fill',
                quality=quality,
                format='webp',
                flags='progressive'
            )[0]
        
        # For external images, return as is
        return image_url
    
    @staticmethod
    def upload_to_cloudinary(image_url, public_id=None):
        """Upload image to Cloudinary for optimization"""
        try:
            response = cloudinary.uploader.upload(
                image_url,
                public_id=public_id,
                transformation=[
                    {'width': 800, 'height': 800, 'crop': 'limit'},
                    {'quality': 'auto'},
                    {'fetch_format': 'auto'}
                ]
            )
            return response['secure_url']
        except Exception as e:
            print(f"Cloudinary upload error: {e}")
            return image_url