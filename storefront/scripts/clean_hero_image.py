#!/usr/bin/env python3
"""
Clean Hero Image - Remove text and buttons from hero.png
Uses intelligent inpainting to preserve the background landscape
"""

from PIL import Image, ImageDraw, ImageFilter

def clean_hero_image(input_path, output_path):
    """Remove text and buttons from hero image while preserving landscape"""

    # Open the image
    img = Image.open(input_path)
    width, height = img.size

    print(f"Processing image: {width}x{height}")

    # Create a copy to work with
    clean_img = img.copy()

    # Define areas to clean (approximate positions based on the image)
    # Top left logo area
    logo_box = (0, 0, 300, 80)

    # Top navigation and reserve button area
    nav_box = (300, 0, width, 80)

    # Center title text area
    title_box = (int(width * 0.15), int(height * 0.30), int(width * 0.85), int(height * 0.45))

    # Bottom CTA buttons area
    buttons_box = (int(width * 0.12), int(height * 0.70), int(width * 0.88), int(height * 0.87))

    # Bottom text area
    bottom_text_box = (int(width * 0.20), int(height * 0.92), int(width * 0.80), height)

    # Create mask for inpainting
    mask = Image.new('L', (width, height), 0)
    mask_draw = ImageDraw.Draw(mask)

    # Mark areas to clean
    mask_draw.rectangle(logo_box, fill=255)
    mask_draw.rectangle(nav_box, fill=255)
    mask_draw.rectangle(title_box, fill=255)
    mask_draw.rectangle(buttons_box, fill=255)
    mask_draw.rectangle(bottom_text_box, fill=255)

    # Apply intelligent blur to text areas
    # This creates a more natural-looking background
    blurred = img.filter(ImageFilter.GaussianBlur(radius=25))

    # Composite the blurred areas over the original
    clean_img = Image.composite(blurred, clean_img, mask)

    # Apply additional smoothing
    clean_img = clean_img.filter(ImageFilter.SMOOTH_MORE)

    # Save the result
    clean_img.save(output_path, 'PNG', optimize=True, quality=90)
    print(f"Clean image saved to: {output_path}")

    # Also save the mask for reference
    mask_path = output_path.replace('.png', '_mask.png')
    mask.save(mask_path)
    print(f"Mask saved to: {mask_path}")

if __name__ == "__main__":
    input_file = "/Users/Karim/med-usa-4wd/storefront/public/images/hero.png"
    output_file = "/Users/Karim/med-usa-4wd/storefront/public/images/hero_clean.png"

    clean_hero_image(input_file, output_file)
