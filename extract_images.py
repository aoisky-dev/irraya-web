import fitz
import sys
import io
from PIL import Image

def extract_images_from_pdf(pdf_path, output_prefix):
    doc = fitz.open(pdf_path)
    for i in range(len(doc)):
        for img in doc.get_page_images(i):
            xref = img[0]
            base_image = doc.extract_image(xref)
            image_bytes = base_image["image"]
            ext = base_image["ext"]
            img_path = f"{output_prefix}_p{i}_{xref}.{ext}"
            
            with open(img_path, "wb") as f:
                f.write(image_bytes)
            print(f"Extracted {img_path}")

extract_images_from_pdf("images/Visiting card.pdf", "images/extracted")
