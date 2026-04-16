from django.core.management.base import BaseCommand
from products.models import Product
import random

class Command(BaseCommand):
    help = 'Create 60 sample products with working images'

    def handle(self, *args, **options):
        # Clear existing products
        Product.objects.all().delete()
        self.stdout.write('Cleared existing products')

        products_data = [
            # ELECTRONICS - 15 products
            {'name': 'Sony WH-1000XM5 Headphones', 'price': 34999, 'description': 'Industry-leading noise canceling with exceptional sound quality and 30-hour battery life', 'image': 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=400', 'category': 'Electronics'},
            {'name': 'Apple AirPods Pro 2', 'price': 24999, 'description': 'Active noise cancellation, spatial audio, and adaptive transparency mode', 'image': 'https://images.unsplash.com/photo-1600293667685-0e60a45e1b5c?w=400', 'category': 'Electronics'},
            {'name': 'Samsung 65" 4K Smart TV', 'price': 89999, 'description': 'Crystal clear 4K resolution with smart hub and voice control', 'image': 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400', 'category': 'Electronics'},
            {'name': 'iPad Pro 12.9"', 'price': 109999, 'description': 'M2 chip, Liquid Retina XDR display, and Apple Pencil hover support', 'image': 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400', 'category': 'Electronics'},
            {'name': 'GoPro HERO11 Black', 'price': 39999, 'description': 'Waterproof action camera with HyperSmooth 5.0 stabilization', 'image': 'https://images.unsplash.com/photo-1502920514313-52581002a659?w=400', 'category': 'Electronics'},
            {'name': 'Canon EOS R50 Camera', 'price': 69999, 'description': '24.2 MP mirrorless camera with 4K video and DIGIC X processor', 'image': 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400', 'category': 'Electronics'},
            {'name': 'Bose SoundLink Flex', 'price': 14999, 'description': 'Portable Bluetooth speaker with waterproof design and 12-hour playtime', 'image': 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400', 'category': 'Electronics'},
            {'name': 'Kindle Paperwhite', 'price': 13999, 'description': '6.8" display, adjustable warm light, and weeks of battery life', 'image': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400', 'category': 'Electronics'},
            {'name': 'Dyson V15 Vacuum', 'price': 79999, 'description': 'Powerful cordless vacuum with laser dust detection', 'image': 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400', 'category': 'Electronics'},
            {'name': 'Ring Video Doorbell', 'price': 19999, 'description': '1080p HD video doorbell with two-way talk and motion detection', 'image': 'https://images.unsplash.com/photo-1558002038-1055907df827?w=400', 'category': 'Electronics'},
            {'name': 'Nest Learning Thermostat', 'price': 24999, 'description': 'Smart thermostat that learns your schedule and saves energy', 'image': 'https://images.unsplash.com/photo-1581094288338-5714ec4fdbeb?w=400', 'category': 'Electronics'},
            {'name': 'Apple Watch Series 9', 'price': 49999, 'description': 'Advanced health monitoring and always-on Retina display', 'image': 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400', 'category': 'Electronics'},
            {'name': 'Samsung Galaxy Tab S9', 'price': 79999, 'description': '11-inch dynamic AMOLED display with S Pen included', 'image': 'https://images.unsplash.com/photo-1589739900243-4b52cd9dd104?w=400', 'category': 'Electronics'},
            {'name': 'Logitech MX Master 3S', 'price': 9999, 'description': 'Advanced wireless mouse with 8K DPI and quiet clicks', 'image': 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400', 'category': 'Electronics'},
            {'name': 'Razer BlackWidow Keyboard', 'price': 15999, 'description': 'Mechanical gaming keyboard with RGB lighting and programmable keys', 'image': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400', 'category': 'Electronics'},
            
            # OFFICE - 15 products
            {'name': 'Ergonomic Office Chair', 'price': 24999, 'description': 'Adjustable height, lumbar support, and breathable mesh back', 'image': 'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=400', 'category': 'Office'},
            {'name': 'Standing Desk Frame', 'price': 34999, 'description': 'Electric height adjustable desk frame with memory presets', 'image': 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400', 'category': 'Office'},
            {'name': 'HP LaserJet Printer', 'price': 19999, 'description': 'Wireless monochrome printer with automatic duplex printing', 'image': 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=400', 'category': 'Office'},
            {'name': 'Bamboo Desk Organizer', 'price': 2999, 'description': 'Eco-friendly bamboo desk organizer with 5 compartments', 'image': 'https://images.unsplash.com/photo-1583864697784-a0efc8379f70?w=400', 'category': 'Office'},
            {'name': 'LED Desk Lamp', 'price': 3999, 'description': 'Adjustable brightness and color temperature with USB charging', 'image': 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400', 'category': 'Office'},
            {'name': 'Magnetic Whiteboard', 'price': 8999, 'description': '36" x 24" magnetic whiteboard with markers and eraser', 'image': 'https://images.unsplash.com/photo-1622737133809-d95047b9e673?w=400', 'category': 'Office'},
            {'name': 'Document Scanner', 'price': 29999, 'description': 'High-speed duplex document scanner with 50-page ADF', 'image': 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=400', 'category': 'Office'},
            {'name': 'Premium Desk Mat', 'price': 2499, 'description': 'Large leather desk mat with stitched edges', 'image': 'https://images.unsplash.com/photo-1618424181497-157f25b6ddd5?w=400', 'category': 'Office'},
            {'name': 'Paper Shredder', 'price': 7999, 'description': 'Cross-cut shredder for confidential documents', 'image': 'https://images.unsplash.com/photo-1588870840202-17b338a69664?w=400', 'category': 'Office'},
            {'name': 'Monitor Stand Riser', 'price': 3499, 'description': 'Ergonomic monitor stand with storage drawer', 'image': 'https://images.unsplash.com/photo-1615141982883-c7ad0a69b72c?w=400', 'category': 'Office'},
            {'name': 'Wireless Keyboard & Mouse', 'price': 5999, 'description': 'Full-size wireless keyboard and mouse combo', 'image': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400', 'category': 'Office'},
            {'name': 'Desk Cable Management', 'price': 1999, 'description': 'Under-desk cable management tray', 'image': 'https://images.unsplash.com/photo-1610824352933-3f4c6c20713c?w=400', 'category': 'Office'},
            {'name': 'Anti-Fatigue Mat', 'price': 4999, 'description': 'Comfortable standing desk mat for all-day comfort', 'image': 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=400', 'category': 'Office'},
            {'name': 'Laptop Cooling Pad', 'price': 3999, 'description': 'Cooling pad with 3 fans and adjustable height', 'image': 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400', 'category': 'Office'},
            {'name': 'USB Conference Speaker', 'price': 8999, 'description': '360° microphone and speaker for conference calls', 'image': 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=400', 'category': 'Office'},
            
            # ACCESSORIES - 15 products
            {'name': 'Phone Tripod with Remote', 'price': 2999, 'description': 'Flexible tripod with Bluetooth remote for vlogging', 'image': 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400', 'category': 'Accessories'},
            {'name': 'Aluminum Laptop Stand', 'price': 3999, 'description': 'Foldable aluminum laptop stand for better ergonomics', 'image': 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?w=400', 'category': 'Accessories'},
            {'name': 'Wireless Charging Pad', 'price': 2999, 'description': '15W fast wireless charger for Qi-enabled devices', 'image': 'https://images.unsplash.com/photo-1583864697784-a0efc8379f70?w=400', 'category': 'Accessories'},
            {'name': 'USB-C Hub 7-in-1', 'price': 5999, 'description': 'HDMI, USB 3.0, SD card reader, and Ethernet ports', 'image': 'https://images.unsplash.com/photo-1606229365485-93a3b8ee0385?w=400', 'category': 'Accessories'},
            {'name': 'Noise Cancelling Earbuds', 'price': 4999, 'description': 'Wireless earbuds with active noise cancellation', 'image': 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400', 'category': 'Accessories'},
            {'name': 'Smart Watch Band', 'price': 1999, 'description': 'Comfortable silicone band for most smartwatches', 'image': 'https://images.unsplash.com/photo-1558126319-c9feecbf57ee?w=400', 'category': 'Accessories'},
            {'name': 'Cable Management Box', 'price': 1499, 'description': 'Hide power strips and cables with wooden lid', 'image': 'https://images.unsplash.com/photo-1610824352933-3f4c6c20713c?w=400', 'category': 'Accessories'},
            {'name': 'Laptop Privacy Screen', 'price': 3499, 'description': '15.6" privacy filter with blue light blocking', 'image': 'https://images.unsplash.com/photo-1588870840202-17b338a69664?w=400', 'category': 'Accessories'},
            {'name': 'Webcam Cover Slide', 'price': 599, 'description': 'Ultra-thin webcam cover slider for privacy', 'image': 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b53?w=400', 'category': 'Accessories'},
            {'name': 'Keyboard Wrist Rest', 'price': 1299, 'description': 'Memory foam wrist rest with non-slip base', 'image': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400', 'category': 'Accessories'},
            {'name': 'Portable Power Bank', 'price': 3999, 'description': '20000mAh power bank with fast charging', 'image': 'https://images.unsplash.com/photo-1609592424471-7ec2b4f6f2db?w=400', 'category': 'Accessories'},
            {'name': 'Car Phone Mount', 'price': 1999, 'description': 'Dashboard phone mount with one-touch release', 'image': 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400', 'category': 'Accessories'},
            {'name': 'Screen Protector Kit', 'price': 999, 'description': 'Tempered glass screen protector with alignment tool', 'image': 'https://images.unsplash.com/photo-1635858940005-1a3d3da0469d?w=400', 'category': 'Accessories'},
            {'name': 'Laptop Sleeve Bag', 'price': 2999, 'description': 'Water-resistant neoprene laptop sleeve', 'image': 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400', 'category': 'Accessories'},
            {'name': 'Smartphone Gimbal', 'price': 7999, 'description': '3-axis smartphone stabilizer for smooth video', 'image': 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400', 'category': 'Accessories'},
            
            # KITCHEN - 15 products
            {'name': 'Digital Air Fryer', 'price': 8999, 'description': '5.8QT digital air fryer with 8 cooking presets', 'image': 'https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=400', 'category': 'Kitchen'},
            {'name': 'Electric Kettle', 'price': 2999, 'description': 'Stainless steel electric kettle with auto shut-off', 'image': 'https://images.unsplash.com/photo-1595000794672-484b19c27c21?w=400', 'category': 'Kitchen'},
            {'name': 'Programmable Coffee Maker', 'price': 12999, 'description': '12-cup coffee maker with thermal carafe', 'image': 'https://images.unsplash.com/photo-1517668808822-9bba02a0a5cd?w=400', 'category': 'Kitchen'},
            {'name': 'Professional Blender', 'price': 7999, 'description': '1500W blender for smoothies and food prep', 'image': 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400', 'category': 'Kitchen'},
            {'name': '2-Slice Toaster', 'price': 3499, 'description': 'Stainless steel toaster with bagel and defrost settings', 'image': 'https://images.unsplash.com/photo-1628614002863-d4b6fe7ae903?w=400', 'category': 'Kitchen'},
            {'name': 'Countertop Microwave', 'price': 14999, 'description': '1.6 cu ft microwave with sensor cooking', 'image': 'https://images.unsplash.com/photo-1574182245530-967d9b383de0?w=400', 'category': 'Kitchen'},
            {'name': 'Food Processor', 'price': 6999, 'description': '10-cup food processor with multiple attachments', 'image': 'https://images.unsplash.com/photo-1568849676085-51415703900f?w=400', 'category': 'Kitchen'},
            {'name': 'Electric Griddle', 'price': 4499, 'description': 'Non-stick electric griddle with adjustable temperature', 'image': 'https://images.unsplash.com/photo-1585478259715-4170e71c7a95?w=400', 'category': 'Kitchen'},
            {'name': 'Immersion Blender', 'price': 3999, 'description': 'Handheld immersion blender with whisk attachment', 'image': 'https://images.unsplash.com/photo-1556909114-44a8131f71d8?w=400', 'category': 'Kitchen'},
            {'name': 'Slow Cooker', 'price': 5499, 'description': '7-quart programmable slow cooker with 3 settings', 'image': 'https://images.unsplash.com/photo-1585515325310-8ac0f43b40c1?w=400', 'category': 'Kitchen'},
            {'name': 'Stand Mixer', 'price': 19999, 'description': '5-quart stand mixer with planetary mixing action', 'image': 'https://images.unsplash.com/photo-1585515325310-8ac0f43b40c1?w=400', 'category': 'Kitchen'},
            {'name': 'Pressure Cooker', 'price': 9999, 'description': '6-quart electric pressure cooker with 14 presets', 'image': 'https://images.unsplash.com/photo-1585515325310-8ac0f43b40c1?w=400', 'category': 'Kitchen'},
            {'name': 'Espresso Machine', 'price': 24999, 'description': '15-bar espresso machine with milk frother', 'image': 'https://images.unsplash.com/photo-1517668808822-9bba02a0a5cd?w=400', 'category': 'Kitchen'},
            {'name': 'Waffle Maker', 'price': 3999, 'description': 'Non-stick waffle maker with 5 browning settings', 'image': 'https://images.unsplash.com/photo-1585478259715-4170e71c7a95?w=400', 'category': 'Kitchen'},
            {'name': 'Rice Cooker', 'price': 4999, 'description': '8-cup digital rice cooker with steaming tray', 'image': 'https://images.unsplash.com/photo-1585515325310-8ac0f43b40c1?w=400', 'category': 'Kitchen'},
        ]

        # Create products
        for product_data in products_data:
            Product.objects.create(**product_data)
            self.stdout.write(f"✓ Added: {product_data['name']} - KES {product_data['price']}")

        self.stdout.write(self.style.SUCCESS(f'\n✅ Successfully created {len(products_data)} products!'))
        
        # List products by category
        self.stdout.write('\n📊 Products by category:')
        from django.db.models import Count
        categories = Product.objects.values('category').annotate(count=Count('id'))
        for cat in categories:
            self.stdout.write(f"  • {cat['category']}: {cat['count']} products")