import os
from PIL import Image

src_dir = 'images'
dest_dir = 'optimized_images'

# Max width for web display
MAX_WIDTH = 2500
# Target size just under the 2MB upload limit
TARGET_SIZE = 1.9 * 1024 * 1024
# High quality for sharp, detailed images
START_QUALITY = 92

if not os.path.exists(dest_dir):
    os.makedirs(dest_dir)

for file in os.listdir(src_dir):
    if file.lower().endswith(('.jpg', '.jpeg', '.png')):
        src_path = os.path.join(src_dir, file)
        dest_path = os.path.join(dest_dir, file)

        try:
            img = Image.open(src_path)

            # Step 1: Resize dimensions if wider than MAX_WIDTH (preserve aspect ratio)
            width, height = img.size
            if width > MAX_WIDTH:
                ratio = MAX_WIDTH / width
                new_size = (MAX_WIDTH, int(height * ratio))
                img = img.resize(new_size, Image.LANCZOS)

            # Step 2: Save at high quality
            quality = START_QUALITY
            img.save(dest_path, "JPEG", quality=quality)

            # Step 3: Only reduce quality further if still over limit (rare after resize)
            while os.path.getsize(dest_path) > TARGET_SIZE and quality > 70:
                quality -= 5
                img.save(dest_path, "JPEG", quality=quality)

            final_size = os.path.getsize(dest_path) / (1024 * 1024)
            print(f"✅ {file}: {width}px → {img.size[0]}px wide | {final_size:.2f} MB | Quality: {quality}")

        except Exception as e:
            print(f"❌ Failed to process {file}: {e}")

