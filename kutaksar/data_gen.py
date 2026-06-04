import os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps

# Mapping from transliteration to Devanagari (based on script.js)
CONSONANTS = {
    'k': 'क', 'kh': 'ख', 'g': 'ग', 'gh': 'घ', 'ng': 'ङ',
    'c': 'च', 'ch': 'छ', 'j': 'ज', 'jh': 'झ', 'ny': 'ञ',
    'T': 'ट', 'Th': 'ठ', 'D': 'ड', 'Dh': 'ढ', 'N': 'ण',
    't': 'त', 'th': 'थ', 'd': 'द', 'dh': 'ध', 'n': 'न',
    'p': 'प', 'ph': 'फ', 'b': 'ब', 'bh': 'भ', 'm': 'म',
    'y': 'य', 'r': 'र', 'l': 'ल', 'v': 'व', 'w': 'व',
    's': 'श', 'sh': 'ष', 'S': 'स', 'h': 'ह',
    '*': '्',  # Halant / Virama for half-letters
}

VOWELS = {
    'a': 'अ', 'aa': 'आ', 'i': 'इ', 'ii': 'ई', 'u': 'उ', 'uu': 'ऊ',
    'e': 'ए', 'ai': 'ऐ', 'o': 'ओ', 'au': 'औ',
}

MATRAS = {
    'a': '',      # Inherent vowel
    'aa': 'ा',
    'i': 'ि',
    'ii': 'ी',
    'u': 'ु',
    'uu': 'ू',
    'e': 'े',
    'ai': 'ै',
    'o': 'ो',
    'au': 'ौ',
}

NUMBERS = {
    '0': '०', '1': '१', '2': '२', '3': '३', '4': '४',
    '5': '५', '6': '६', '7': '७', '8': '८', '9': '९'
}

SYMBOLS = {
    '.': '।',   # Danda (often used as full stop in Devanagari)
    ',': ',', 
    '(': '(', 
    ')': ')',
    '-': '-',
    '?': '?'
}

FONT_PATH = "NithyaRanjanaDU-Regular.otf"
IMAGE_SIZE = (64, 64)
DATASET_DIR = "dataset"

def generate_character_image(char, font_path, size=(64, 64)):
    # Create a white background image
    image = Image.new('L', size, color=255)
    draw = ImageDraw.Draw(image)
    
    # Load font
    try:
        font = ImageFont.truetype(font_path, 40)
    except Exception as e:
        print(f"Error loading font: {e}")
        return None
    
    # If the character is a combining mark (like halant), prefix it with a dotted circle (U+25CC)
    display_char = char
    if char == '्':
        display_char = '◌' + char

    # Get text size and position
    # In newer Pillow versions, use getbbox
    bbox = draw.textbbox((0, 0), display_char, font=font)
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    
    # Center the character
    x = (size[0] - w) / 2 - bbox[0]
    y = (size[1] - h) / 2 - bbox[1]
    
    draw.text((x, y), display_char, font=font, fill=0)
    return image

def create_dataset():
    if not os.path.exists(DATASET_DIR):
        os.makedirs(DATASET_DIR)
    
    all_chars = {**CONSONANTS, **VOWELS, **NUMBERS, **SYMBOLS}
    
    # Track generated characters to avoid duplicates (e.g., 'v' and 'w' both mapping to 'व')
    generated_chars = set()

    for label, char in all_chars.items():
        if char in generated_chars:
            print(f"Skipping duplicate character mapping: {label}")
            continue
            
        # Use the Devanagari character itself as the folder name
        # This prevents Windows from merging folders like 't' and 'T'
        
        # Mapping unsafe characters to safe OS folder names
        safe_names = {
            '*': 'halant',
            '.': 'danda',
            ',': 'comma',
            '?': 'question',
            '(': 'paren_left',
            ')': 'paren_right',
            '-': 'dash'
        }
        
        folder_name = safe_names.get(label, char)
        char_dir = os.path.join(DATASET_DIR, folder_name)
        if not os.path.exists(char_dir):
            os.makedirs(char_dir)
        
        # Generate clean sample
        img = generate_character_image(char, FONT_PATH, IMAGE_SIZE)
        if img:
            file_label = safe_names.get(label, label)
            img.save(os.path.join(char_dir, f"{file_label}_orig.png"))
            
            # Generate augmented samples
            for i in range(100):
                # Random rotation
                angle = np.random.randint(-12, 13)
                aug_img = img.rotate(angle, fillcolor=255)
                
                # Random scaling
                scale = np.random.uniform(0.85, 1.15)
                new_w, new_h = int(IMAGE_SIZE[0] * scale), int(IMAGE_SIZE[1] * scale)
                aug_img = aug_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
                
                # Canvas for pasting scaled image back to size
                bg = Image.new('L', IMAGE_SIZE, color=255)
                # Paste at center
                bg.paste(aug_img, ((IMAGE_SIZE[0] - new_w) // 2, (IMAGE_SIZE[1] - new_h) // 2))
                aug_img = bg
                
                # Random translation
                dx = np.random.randint(-4, 5)
                dy = np.random.randint(-4, 5)
                aug_img = ImageOps.expand(aug_img, (abs(dx), abs(dy), abs(dx), abs(dy)), fill=255)
                # Crop back to center
                left = abs(dx) - dx
                top = abs(dy) - dy
                aug_img = aug_img.crop((left, top, left + IMAGE_SIZE[0], top + IMAGE_SIZE[1]))
                aug_img = aug_img.resize(IMAGE_SIZE)
                
                # Add subtle noise
                arr = np.array(aug_img).astype(np.float32)
                noise = np.random.normal(0, 3, arr.shape)
                arr = np.clip(arr + noise, 0, 255).astype(np.uint8)
                aug_img = Image.fromarray(arr)
                
                aug_img.save(os.path.join(char_dir, f"{file_label}_aug_{i}.png"))
                
            print(f"Generated samples for class (label: {label})")
            generated_chars.add(char)

def inject_custom_sample(img, label):
    """Saves a custom image (e.g. a ligature) and generates augmented samples."""
    char_dir = os.path.join(DATASET_DIR, label)
    if not os.path.exists(char_dir):
        os.makedirs(char_dir)
    
    # Ensure image is in 'L' mode (Grayscale) for the model
    if img.mode != 'L':
        img = img.convert('L')
    
    # Resize to the standard dataset size
    img = img.resize(IMAGE_SIZE, Image.Resampling.LANCZOS)
    img.save(os.path.join(char_dir, f"{label}_orig.png"))
    
    # Generate augmented samples (same logic as create_dataset)
    for i in range(100):
        angle = np.random.randint(-12, 13)
        aug_img = img.rotate(angle, fillcolor=255)
        scale = np.random.uniform(0.85, 1.15)
        new_w, new_h = int(IMAGE_SIZE[0] * scale), int(IMAGE_SIZE[1] * scale)
        aug_img = aug_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        bg = Image.new('L', IMAGE_SIZE, color=255)
        bg.paste(aug_img, ((IMAGE_SIZE[0] - new_w) // 2, (IMAGE_SIZE[1] - new_h) // 2))
        aug_img = bg
        dx, dy = np.random.randint(-4, 5), np.random.randint(-4, 5)
        aug_img = ImageOps.expand(aug_img, (abs(dx), abs(dy), abs(dx), abs(dy)), fill=255)
        left, top = abs(dx) - dx, abs(dy) - dy
        aug_img = aug_img.crop((left, top, left + IMAGE_SIZE[0], top + IMAGE_SIZE[1]))
        aug_img = aug_img.resize(IMAGE_SIZE)
        arr = np.array(aug_img).astype(np.float32)
        noise = np.random.normal(0, 3, arr.shape)
        arr = np.clip(arr + noise, 0, 255).astype(np.uint8)
        aug_img = Image.fromarray(arr)
        aug_img.save(os.path.join(char_dir, f"{label}_aug_{i}.png"))

if __name__ == "__main__":
    create_dataset()
