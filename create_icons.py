from PIL import Image, ImageDraw

def create_icon(size, filename):
    # Create a new image with blue background
    image = Image.new("RGBA", (size, size), (65, 105, 225, 255))

    # Get a drawing context
    draw = ImageDraw.Draw(image)

    # Draw a simple design - a white circle
    margin = size // 4
    draw.ellipse([margin, margin, size - margin, size - margin], fill="white")

    # Save the image as PNG
    image.save(filename, "PNG")


# Create icons in all required sizes
create_icon(32, "src-tauri/icons/32x32.png")
create_icon(128, "src-tauri/icons/128x128.png")
create_icon(256, "src-tauri/icons/icon.png")

