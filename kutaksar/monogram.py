import io
import os
import json
from pathlib import Path
from typing import Optional
import numpy as np
import data_gen
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from PIL import Image, ImageChops, ImageDraw, ImageFont
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent
FONT_PATH = BASE_DIR / "NithyaRanjanaDU-Regular.otf"
GLYPH_CONFIG_PATH = BASE_DIR / "glyph_configs.json"
LIGATURE_CONFIG_PATH = BASE_DIR / "ligature_configs.json"

app = FastAPI(title="Monogram API")

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "").split(",") 

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MonogramRequest(BaseModel):
    text: str
    font_size: int = 80
    fg_color: str = "#2d1b69"
    bg_color: Optional[str] = "#ffffff"
    padding: int = 40
    line_spacing: int = 0
    vertical: bool = True
    use_overrides: bool = True

# Build a single transliteration → Devanagari lookup map
DEVANAGARI_MAP = {**data_gen.CONSONANTS, **data_gen.VOWELS, **data_gen.NUMBERS, **data_gen.SYMBOLS}

CLUSTER_REGEX = r'[क-हक़-य़][्]?[ा-ौँ-ः॑-॔ॢ-ॣ]?|[अ-औ]'

def load_glyph_configs():
    if GLYPH_CONFIG_PATH.exists():
        with GLYPH_CONFIG_PATH.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    return {}

def save_glyph_configs(configs):
    with GLYPH_CONFIG_PATH.open("w", encoding="utf-8") as handle:
        json.dump(configs, handle, ensure_ascii=False, indent=2)

def load_ligature_configs():
    if LIGATURE_CONFIG_PATH.exists():
        with LIGATURE_CONFIG_PATH.open("r", encoding="utf-8") as handle:
            return json.load(handle)
    return {}

def save_ligature_configs(configs):
    with LIGATURE_CONFIG_PATH.open("w", encoding="utf-8") as handle:
        json.dump(configs, handle, ensure_ascii=False, indent=2)

def _hex_to_rgb(hex_color: str):
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i:i + 2], 16) for i in (0, 2, 4))

def detect_primary_stem(char_img: Image.Image) -> int:
    """
    Detects the horizontal X-coordinate of the primary vertical stem in a character.
    Focuses on the bottom 60% of the glyph to avoid the headline (Shirorekha) 
    and top loops, ensuring robust detection for double-stemmed characters like ग and भ.
    """
    if char_img.mode != "RGBA":
        char_img = char_img.convert("RGBA")
    
    arr = np.array(char_img)
    h, w, c = arr.shape
    if h == 0 or w == 0:
        return 0

    # Focus on bottom 60% to isolate clean vertical stems
    start_row = int(h * 0.4)
    bottom_half_alpha = arr[start_row:, :, 3]
    
    # Sum the opacity values vertically along each column
    col_sums = np.sum(bottom_half_alpha, axis=0)
    
    if len(col_sums) == 0 or np.max(col_sums) == 0:
        return w // 2  # Fallback to visual center
        
    # Smooth column values with a moving average to suppress minor noise
    kernel_size = 3
    if len(col_sums) > kernel_size:
        col_sums_smoothed = np.convolve(col_sums, np.ones(kernel_size)/kernel_size, mode='same')
    else:
        col_sums_smoothed = col_sums

    # Find significant local peaks
    peaks = []
    threshold = np.max(col_sums_smoothed) * 0.4
    
    for i in range(1, len(col_sums_smoothed) - 1):
        if col_sums_smoothed[i] > threshold:
            if col_sums_smoothed[i] >= col_sums_smoothed[i-1] and col_sums_smoothed[i] >= col_sums_smoothed[i+1]:
                peaks.append((i, col_sums_smoothed[i]))
                
    if not peaks:
        return int(np.argmax(col_sums_smoothed))
        
    # Sort detected peaks by height (descending)
    peaks.sort(key=lambda x: x[1], reverse=True)
    
    # For double-stemmed characters, favor the rightmost major peak (the main vertical spine)
    if len(peaks) >= 2:
        primary_peak = peaks[0]
        rightmost_major_peak = primary_peak
        for peak in peaks[1:]:
            if peak[1] > primary_peak[1] * 0.70 and peak[0] > rightmost_major_peak[0]:
                rightmost_major_peak = peak
        return int(rightmost_major_peak[0])
        
    return int(peaks[0][0])

# Hardcoded classifications as defined by your structural rules
DOUBLE_STEM_CHARS = {
    "ख", "ग", "घ", "ङ", "झ", "ण", "थ", "ध", "प", "फ", "भ", "म", "य", "श", "ष", "स"
}

def find_rightmost_stem_bounds(char_img: Image.Image) -> tuple[int, int]:
    """
    Scans the cropped character image columns from right-to-left.
    Focuses on the very top of the cropped character to avoid the headline (head).
    Locates the exact start (inner side) and end (outer side) of the FIRST color 
    portion encountered (which is the rightmost vertical stem).
    """
    if char_img.mode != "RGBA":
        char_img = char_img.convert("RGBA")
        
    arr = np.array(char_img)
    h, w, c = arr.shape
    if h == 0 or w == 0:
        return int(w * 0.75), int(w * 0.85)

    # Step 1: Find the first visible pixel row near the top of the cropped letter
    top_row = 0
    for y in range(h):
        if np.any(arr[y, :, 3] > 30):
            top_row = y
            break
            
    # Step 2: Scan a thin horizontal slice of 6 rows at the top of the cropped letter (avoiding the head)
    start_row = top_row
    end_row = min(h, top_row + 6)
    
    top_slice_alpha = arr[start_row:end_row, :, 3]
    col_sums = np.sum(top_slice_alpha, axis=0)
    
    # Establish a clean noise threshold (column must be at least 15% solid ink)
    max_possible_sum = 255 * (end_row - start_row)
    threshold = max_possible_sum * 0.15

    # Step 3: Scan from right to left to locate the rightmost (first) stem
    primary_end_x = None  # Right edge of first stem
    primary_start_x = None  # Left edge of first stem
    
    col = w - 1
    # Move leftwards to find where the first color starts
    while col >= 0:
        if col_sums[col] >= threshold:
            primary_end_x = col
            break
        col -= 1
        
    if primary_end_x is not None:
        # Keep moving left until this first color portion ends (completed)
        col = primary_end_x
        while col >= 0:
            if col_sums[col] < threshold:
                primary_start_x = col + 1
                break
            col -= 1
        if primary_start_x is None:
            primary_start_x = 0
    else:
        # Fallback if no primary stem is found
        thickness = max(4, int(w * 0.08))
        primary_end_x = int(w * 0.85)
        primary_start_x = max(0, primary_end_x - thickness)

    return int(primary_start_x), int(primary_end_x)

def find_right_stem_bounds(char_img: Image.Image) -> tuple[int, int]:
    """
    Backwards compatibility alias using the scan-based detection.
    """
    return find_rightmost_stem_bounds(char_img)

def find_right_stem_x(char_img: Image.Image) -> int:
    """
    Compatibility alias returning the center of the detected rightmost stem.
    """
    p_start, p_end = find_rightmost_stem_bounds(char_img)
    return (p_start + p_end) // 2

def find_stem_vertical_bottom(char_img: Image.Image, start_x: int, end_x: int) -> int:
    """
    Scans rows from bottom-to-top in the stem column slice [start_x, end_x].
    Uses the average opacity of each row slice to identify the true calligraphic
    termination of the thick vertical stem, completely ignoring anti-aliasing noise.
    """
    if char_img.mode != "RGBA":
        char_img = char_img.convert("RGBA")
    arr = np.array(char_img)
    h, w, c = arr.shape
    if h == 0 or w == 0:
        return h
    
    # Clamp coordinates to safe bounds
    sx = max(0, min(w - 1, start_x))
    ex = max(0, min(w, end_x))
    if sx >= ex:
        return h
        
    # Scan bottom-up
    for y in range(h - 1, -1, -1):
        row_slice = arr[y, sx:ex, 3]
        # Solid stem core columns require substantial average density (ignores fuzzy anti-aliasing)
        if np.mean(row_slice) > 100:
            return y + 1  # Return height coordinate (1-based index)
            
    return h

def slice_secondary_stem(char_img: Image.Image, s_x: int) -> tuple[int, int, int]:
    """
    Slices the secondary stem at s_x vertically into Top, Middle, and Bottom parts.
    Returns (y_start, y_top_break, y_intersection).
    """
    arr = np.array(char_img)
    h, w, c = arr.shape
    alpha = arr[:, :, 3]
    
    # 1. Find y_start (first solid pixel at s_x column)
    y_start = 0
    for y in range(h):
        if alpha[y, s_x] > 50:
            y_start = y
            break
            
    # 2. y_top_break represents the bottom edge of the horizontal headline
    headline_thickness = max(8, int(h * 0.16))
    y_top_break = y_start + headline_thickness
    
    # 3. Find y_intersection (where loops/curves attach to the stem)
    y_intersection = None
    span = 12
    for y in range(y_top_break + 5, int(h * 0.85)):
        left_bound = max(0, s_x - span)
        right_bound = min(w, s_x + span)
        row_density = np.sum(alpha[y, left_bound:right_bound] > 50)
        
        # A clean vertical stem has narrow horizontal density; loops broaden it
        if row_density > 15:
            y_intersection = y
            break
            
    # Fallback to standard proportions if no clear intersection is found
    if y_intersection is None:
        y_intersection = y_start + int(h * 0.65)
        
    return int(y_start), int(y_top_break), int(y_intersection)

@app.get("/status")
async def status():
    return {
        "glyph_config_exists": GLYPH_CONFIG_PATH.exists(),
        "ligature_config_exists": LIGATURE_CONFIG_PATH.exists(),
        "font_exists": FONT_PATH.exists(),
    }

class GlyphSaveRequest(BaseModel):
    char: str
    type: str  # "full", "half", "first", "middle", "last"
    scale: float
    x_offset: int
    y_offset: int
    rotation: float = 0.0
    skew_x: float = 0.0
    skew_y: float = 0.0
    crop_top: int = 0
    crop_bottom: int = 0
    crop_left: int = 0
    crop_right: int = 0

class LigatureCharConfig(BaseModel):
    char: str
    scale: float = 1.0
    x_offset: int = 0
    y_offset: int = 0
    y_advance: Optional[int] = None
    rotation: float = 0.0
    skew_x: float = 0.0
    skew_y: float = 0.0
    crop_top: int = 0
    crop_bottom: int = 0
    crop_left: int = 0
    crop_right: int = 0
    mask: Optional[str] = None
    adjustments: Optional[list[dict]] = None

class LigatureSaveRequest(BaseModel):
    sequence: str # e.g. "क+र"
    chars: list[LigatureCharConfig]
    mask: Optional[str] = None # Base64 PNG mask for corrections
    adjustments: Optional[list[dict]] = None # Manual moves/extends

@app.get("/glyphs")
async def get_glyphs():
    return load_glyph_configs()

@app.post("/glyphs/save")
async def save_glyph(req: GlyphSaveRequest):
    try:
        configs = load_glyph_configs()
        if req.char not in configs:
            configs[req.char] = {}
        configs[req.char][req.type] = {
            "scale": req.scale,
            "x_offset": req.x_offset,
            "y_offset": req.y_offset,
            "rotation": req.rotation,
            "skew_x": req.skew_x,
            "skew_y": req.skew_y,
            "crop_top": req.crop_top,
            "crop_bottom": req.crop_bottom,
            "crop_left": req.crop_left,
            "crop_right": req.crop_right
        }
        save_glyph_configs(configs)
        return {"message": "Config saved", "char": req.char, "type": req.type}
    except Exception as e:
        print(f"Error saving glyph config: {e}")
        import traceback
        traceback.print_exc()
        return Response(
            content=json.dumps({"error": f"Failed to save configuration: {str(e)}"}),
            status_code=500,
            media_type="application/json"
        )

@app.get("/ligatures")
async def get_ligatures():
    return load_ligature_configs()

@app.post("/ligatures/save")
async def save_ligature(req: LigatureSaveRequest):
    configs = load_ligature_configs()
    configs[req.sequence] = [c.dict() for c in req.chars]
    save_ligature_configs(configs)
    return {"message": "Ligature rule saved"}

@app.post("/glyphs/preview")
async def preview_glyph(req: GlyphSaveRequest):
    font_path = "NithyaRanjanaDU-Regular.otf"
    font_size = 120
    try:
        font = ImageFont.truetype(font_path, font_size)
    except Exception as e:
        return Response(
            content=json.dumps({"error": f"Font load failed: {e}"}),
            status_code=500,
            media_type="application/json"
        )

    try:
        # If it's a half-letter, append halant if not present
        display_char = req.char
        if req.type == "half" and not display_char.endswith('्'):
            display_char += '्'

        # Create a larger canvas for the initial render to avoid clipping before crop
        temp_img = Image.new("RGBA", (300, 300), color=(255, 255, 255, 0))
        temp_draw = ImageDraw.Draw(temp_img)
        
        scaled_font_size = int(font_size * req.scale)
        scaled_font = ImageFont.truetype(font_path, scaled_font_size)
        
        bb = scaled_font.getbbox(display_char)
        w, h = bb[2]-bb[0], bb[3]-bb[1]
        
        # Draw at center
        x = (300 - w) // 2 - bb[0]
        y = (300 - h) // 2 - bb[1]
        temp_draw.text((x, y), display_char, font=scaled_font, fill=(45, 27, 105, 255))
        
        # Apply transformations (Rotation and Skew)
        if req.rotation != 0 or req.skew_x != 0 or req.skew_y != 0:
            if req.rotation != 0:
                temp_img = temp_img.rotate(req.rotation, resample=Image.BICUBIC, expand=False)
            
            if req.skew_x != 0 or req.skew_y != 0:
                tw, th = temp_img.size
                temp_img = temp_img.transform(temp_img.size, Image.AFFINE, 
                                             (1, -req.skew_x, req.skew_x * (th/2), -req.skew_y, 1, req.skew_y * (tw/2)),
                                             resample=Image.BICUBIC)
        
        # Apply cropping by clearing pixels
        if req.crop_top > 0 or req.crop_bottom > 0 or req.crop_left > 0 or req.crop_right > 0:
            tw, th = temp_img.size
            c_left = x + bb[0] + req.crop_left
            c_top = y + bb[1] + req.crop_top
            c_right = x + bb[2] - req.crop_right
            c_bottom = y + bb[3] - req.crop_bottom
            
            if c_top > 0: temp_img.paste((0,0,0,0), (0, 0, tw, c_top))
            if c_bottom < th: temp_img.paste((0,0,0,0), (0, c_bottom, tw, th))
            if c_left > 0: temp_img.paste((0,0,0,0), (0, 0, c_left, th))
            if c_right < tw: temp_img.paste((0,0,0,0), (c_right, 0, tw, th))

        orig_w, orig_h = w, h
        x_base = (200 - orig_w) // 2
        y_base = (200 - orig_h) // 2

        img = Image.new("RGBA", (200, 200), color=(255, 255, 255, 0))
        crop_bb = (x + bb[0], y + bb[1], x + bb[2], y + bb[3])
        cropped_part = temp_img.crop(crop_bb)
        img.paste(cropped_part, (x_base + req.x_offset, y_base + req.y_offset))

        buf = io.BytesIO()
        img.save(buf, format="PNG")
        buf.seek(0)
        return StreamingResponse(buf, media_type="image/png", headers={"Cache-Control": "no-cache"})
    except Exception as e:
        print(f"Error in preview_glyph: {e}")
        import traceback
        traceback.print_exc()
        return Response(
            content=json.dumps({"error": f"Preview generation failed: {str(e)}"}),
            status_code=500,
            media_type="application/json"
        )

@app.get("/glyph/preview")
async def glyph_preview(char: str):
    font_path = "NithyaRanjanaDU-Regular.otf"
    font_size = 150
    try:
        font = ImageFont.truetype(font_path, font_size)
        bb = font.getbbox(char)
        w, h = bb[2]-bb[0], bb[3]-bb[1]
        img = Image.new("RGBA", (w+40, h+40), (0,0,0,0))
        draw = ImageDraw.Draw(img)
        draw.text((20-bb[0], 20-bb[1]), char, font=font, fill=(45, 27, 105, 255))
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return Response(content=buf.getvalue(), media_type="image/png")
    except Exception as e:
        return {"error": str(e)}

@app.post("/ligatures/preview")
async def preview_ligature(req: LigatureSaveRequest):
    font_path = "NithyaRanjanaDU-Regular.otf"
    font_size = 100
    try:
        font = ImageFont.truetype(font_path, font_size)
    except Exception as e:
        return {"error": f"Font load failed: {e}"}

    img_h = 200 + (len(req.chars) * (font_size + 20))
    img = Image.new("RGBA", (400, img_h), color=(255, 255, 255, 0))
    
    y_cursor = 50
    ascent, descent = font.getmetrics()

    for c in req.chars:
        try:
            char_font = ImageFont.truetype(font_path, int(font_size * c.scale))
            bb = char_font.getbbox(c.char)
            cw, ch = bb[2] - bb[0], bb[3] - bb[1]
            
            char_layer = Image.new("RGBA", (cw + 200, ch + 200), (0,0,0,0))
            char_draw = ImageDraw.Draw(char_layer)
            char_draw.text((100 - bb[0], 100 - bb[1]), c.char, font=char_font, fill=(45, 27, 105, 255))
            
            if c.skew_x != 0 or c.skew_y != 0:
                cw_layer, th_layer = char_layer.size
                char_layer = char_layer.transform(
                    (cw_layer, th_layer),
                    Image.AFFINE,
                    (1, -c.skew_x, c.skew_x * (th_layer/2), -c.skew_y, 1, c.skew_y * (cw_layer/2)),
                    Image.Resampling.BICUBIC
                )

            if c.rotation != 0:
                char_layer = char_layer.rotate(c.rotation, expand=True, resample=Image.Resampling.BICUBIC)
            
            if any([c.crop_top, c.crop_bottom, c.crop_left, c.crop_right]):
                bbox = char_layer.getbbox()
                if bbox:
                    bl, bt, br, bb_y = bbox
                    cw_layer, th_layer = char_layer.size
                    if c.crop_top > 0:
                        char_layer.paste((0,0,0,0), (0, 0, cw_layer, bt + c.crop_top))
                    if c.crop_bottom > 0:
                        char_layer.paste((0,0,0,0), (0, bb_y - c.crop_bottom, cw_layer, th_layer))
                    if c.crop_left > 0:
                        char_layer.paste((0,0,0,0), (0, 0, bl + c.crop_left, th_layer))
                    if c.crop_right > 0:
                        char_layer.paste((0,0,0,0), (br - c.crop_right, 0, cw_layer, th_layer))

            x_pos = (400 - char_layer.width) // 2 + c.x_offset
            y_pos = y_cursor + c.y_offset

            if c.mask:
                try:
                    import base64
                    mask_data = base64.b64decode(c.mask.split(',')[1])
                    mask_img = Image.open(io.BytesIO(mask_data)).convert("L")
                    char_mask = mask_img.crop((x_pos, y_pos, x_pos + char_layer.width, y_pos + char_layer.height))
                    new_alpha_mask = char_mask.point(lambda x: 0 if x < 128 else 255, 'L')
                    orig_alpha = char_layer.getchannel('A')
                    final_alpha = ImageChops.darker(orig_alpha, new_alpha_mask)
                    char_layer.putalpha(final_alpha)
                except Exception as e:
                    print(f"Char mask error: {e}")

            if c.adjustments:
                try:
                    for adj in c.adjustments:
                        lx = adj['x'] - x_pos
                        ly = adj['y'] - y_pos
                        low, loh = adj['ow'], adj['oh']
                        ldx, ldy = adj['dx'], adj['dy']
                        
                        part = char_layer.crop((lx, ly, lx + low, ly + loh))
                        if adj.get('mode') == 'move':
                            char_layer.paste((0,0,0,0), (int(lx), int(ly), int(lx+low), int(ly+loh)))
                        if adj.get('mode') == 'extend' and adj.get('fw') and adj.get('fh'):
                            part = part.resize((int(abs(adj['fw'])), int(abs(adj['fh']))), Image.Resampling.LANCZOS)
                        char_layer.paste(part, (int(lx+ldx), int(ly+ldy)), part)
                except Exception as e:
                    print(f"Char adj error: {e}")

            img.paste(char_layer, (x_pos, y_pos), char_layer)
            
            if c.y_advance:
                y_cursor += c.y_advance
            else:
                y_cursor += (ch + 20)
        except Exception as e:
            print(f"Layer failed: {e}")

    bbox = img.getbbox()
    if not bbox:
        img = Image.new("RGBA", (400, 200), (0,0,0,0))

    if req.mask:
        try:
            import base64
            mask_data = base64.b64decode(req.mask.split(",")[1])
            mask_img = Image.open(io.BytesIO(mask_data)).convert("L")
            mask_img = mask_img.resize(img.size, Image.Resampling.LANCZOS)
            final_alpha = img.split()[3]
            new_alpha_mask = mask_img.point(lambda x: 0 if x < 128 else 255, '1')
            combined_alpha = Image.new("L", img.size, 0)
            combined_alpha.paste(final_alpha, (0, 0), mask=new_alpha_mask)
            img.putalpha(combined_alpha)
        except Exception as e:
            print(f"Global mask failed: {e}")

    if req.adjustments:
        try:
            for adj in req.adjustments:
                part = img.crop((adj['x'], adj['y'], adj['x']+adj['ow'], adj['y']+adj['oh']))
                
                if adj.get('mode') == 'move':
                    draw = ImageDraw.Draw(img)
                    draw.rectangle([adj['x'], adj['y'], adj['x']+adj['ow'], adj['y']+adj['oh']], fill=(0,0,0,0))
                
                if adj.get('mode') == 'extend' and adj.get('fw') and adj.get('fh'):
                    part = part.resize((int(abs(adj['fw'])), int(abs(adj['fh']))), Image.LANCZOS)
                
                img.paste(part, (int(adj['x']+adj['dx']), int(adj['y']+adj['dy'])), part)
        except Exception as e:
            print(f"Adjustments failed: {e}")

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")

@app.post("/ligatures/inject")
async def inject_ligature(req: LigatureSaveRequest):
    resp = await preview_ligature(req)
    if isinstance(resp, dict) and "error" in resp:
        return resp
    
    img_data = b"".join([chunk async for chunk in resp.body_iterator])
    img = Image.open(io.BytesIO(img_data))
    
    bg = Image.new("RGB", img.size, (255, 255, 255))
    bg.paste(img, (0, 0), img)
    
    try:
        label = f"lig_{req.sequence.replace('+', '_')}"
        data_gen.inject_custom_sample(bg, label)
        return {"message": f"Ligature '{req.sequence}' added to training set as '{label}'. Please retrain to activate."}
    except Exception as e:
        return {"error": f"Injection failed: {e}"}

@app.post("/monogram")
async def render_monogram(req: MonogramRequest):
    font_path = str(FONT_PATH)
    text = req.text.strip()
    if not text:
        return {"error": "No text provided"}

    # Transliteration mapping logic (retains your original logic)
    import re
    if not re.search(r'[ऀ-ॿ]', text):
        translit_map = {**data_gen.CONSONANTS, **data_gen.VOWELS, **data_gen.NUMBERS, **data_gen.SYMBOLS}
        matra_map = data_gen.MATRAS
        keys = sorted(translit_map.keys(), key=len, reverse=True)
        vowel_keys = sorted(data_gen.VOWELS.keys(), key=len, reverse=True)

        converted = ""
        i = 0
        last_was_consonant = False

        while i < len(text):
            match = False
            if last_was_consonant:
                for vk in vowel_keys:
                    if text[i:i + len(vk)] == vk:
                        converted += matra_map.get(vk, data_gen.VOWELS[vk])
                        i += len(vk)
                        match = True
                        last_was_consonant = False
                        break

            if not match:
                for key in keys:
                    if text[i:i + len(key)] == key:
                        converted += translit_map[key]
                        i += len(key)
                        match = True
                        last_was_consonant = key in data_gen.CONSONANTS and key != '*'
                        break

            if not match:
                converted += text[i]
                i += 1
                last_was_consonant = False

        text = converted

    try:
        font = ImageFont.truetype(font_path, req.font_size)
    except Exception as exc:
        return {"error": f"Font load failed: {exc}"}

    ascent, descent = font.getmetrics()
    line_height = ascent + descent

    # Define colors early
    transparent = req.bg_color is None or req.bg_color.lower() == "transparent"
    bg = (0, 0, 0, 0) if transparent else (*_hex_to_rgb(req.bg_color), 255)
    fg = (*_hex_to_rgb(req.fg_color), 255)

    if req.vertical and "\n" not in text:
        lines = re.findall(CLUSTER_REGEX, text)
        if not font:
            lines = list(text)
    else:
        lines = text.split("\n")

    i_matra = 'ि'
    processed_lines = []

    for line in lines:
        if i_matra in line:
            clusters = re.findall(CLUSTER_REGEX, line)
            new_line = ""
            for cluster in clusters:
                if i_matra in cluster:
                    new_line += i_matra + cluster.replace(i_matra, '')
                else:
                    new_line += cluster
            remaining = line
            for cluster in clusters:
                remaining = remaining.replace(cluster, '', 1)
            new_line += remaining
            processed_lines.append(new_line)
        else:
            processed_lines.append(line)

    lines = processed_lines

    MATRA_POS = {
        'ि': 'left',
        'ी': 'right',
        'ा': 'right',
        'ु': 'below',
        'ू': 'below',
        'े': 'above',
        'ै': 'above',
        'ो': 'right',
        'ौ': 'right',
    }

    present_matras = set()
    for line in lines:
        for matra_char in MATRA_POS.keys():
            if matra_char in line:
                present_matras.add(matra_char)

    final_matras = set()
    if present_matras:
        has_i = 'ि' in present_matras
        has_ii = 'ी' in present_matras
        has_aa = 'ा' in present_matras

        if has_i:
            final_matras.add('ि')
        if has_aa and has_ii:
            final_matras.add('ी')
        else:
            if has_aa:
                final_matras.add('ा')
            if has_ii:
                final_matras.add('ी')

        if 'ु' in present_matras:
            final_matras.add('ु')
        elif 'ू' in present_matras:
            final_matras.add('ू')

        for matra_char in ['े', 'ै', 'ो', 'ौ']:
            if matra_char in present_matras:
                final_matras.add(matra_char)

        lines = [''.join(ch for ch in line if ch not in MATRA_POS) for line in lines]

    lig_configs = load_ligature_configs() if req.use_overrides else {}
    merged_lines = []
    skip_next = 0
    for i in range(len(lines)):
        if skip_next > 0:
            skip_next -= 1
            continue

        found_lig = False
        for length in range(6, 1, -1):
            if i + length - 1 < len(lines):
                seq = "+".join(lines[i:i + length])
                if seq in lig_configs:
                    merged_lines.append({"text": seq, "type": "ligature", "conf": lig_configs[seq]})
                    skip_next = length - 1
                    found_lig = True
                    break
        if not found_lig:
            merged_lines.append({"text": lines[i], "type": "char"})

    # --- CALCULATION OF LINE_WIDTHS & TOTAL_RENDERED_HEIGHT ---
    line_widths = []
    total_rendered_height = 0
    configs = load_glyph_configs() if req.use_overrides else {}

    for item in merged_lines:
        line = item["text"]
        if item["type"] == "ligature":
            max_w = 0
            for conf in item["conf"]:
                f_size = int(req.font_size * conf.get("scale", 1.0))
                tmp_font = ImageFont.truetype(font_path, f_size)
                bb = tmp_font.getbbox(conf["char"])
                max_w = max(max_w, bb[2] - bb[0] + abs(conf.get("x_offset", 0)))
                total_rendered_height += line_height + req.line_spacing
            line_widths.append(max_w)
        else:
            bb = font.getbbox(line)
            line_widths.append(bb[2] - bb[0])
            total_rendered_height += line_height + req.line_spacing

    # ----------------- PHASE 1: PRE-RENDER AND ANALYZE STEMS -----------------
    prepared_items = []
    left_extents = []
    right_extents = []

    for i, item in enumerate(merged_lines):
        line = item["text"]

        if item["type"] == "ligature":
            char_configs = item["conf"]
            lig_layer_h = (len(char_configs) * (req.font_size + req.line_spacing)) + 100
            estimated_w = req.font_size * 3  # Wide sandbox layer
            lig_layer = Image.new("RGBA", (estimated_w, lig_layer_h), (0, 0, 0, 0))
            lig_y_cursor = 0
            studio_y_cursor = 50

            for override in char_configs:
                display_text = override["char"]
                scale_factor = req.font_size / 100.0
                scale = override.get("scale", 1.0)
                x_off = int(override.get("x_offset", 0) * scale_factor)
                y_off = int(override.get("y_offset", 0) * scale_factor)
                rot = override.get("rotation", 0.0)
                sx = override.get("skew_x", 0.0)
                sy = override.get("skew_y", 0.0)
                c_top = int(override.get("crop_top", 0) * scale_factor)
                c_bottom = int(override.get("crop_bottom", 0) * scale_factor)
                c_left = int(override.get("crop_left", 0) * scale_factor)
                c_right = int(override.get("crop_right", 0) * scale_factor)

                current_font = font
                if scale != 1.0:
                    current_font = ImageFont.truetype(font_path, int(req.font_size * scale))

                bb = current_font.getbbox(display_text)
                w, h = bb[2] - bb[0], bb[3] - bb[1]
                tw, th = w + 100, h + 100
                char_temp = Image.new("RGBA", (tw, th), color=(0, 0, 0, 0))
                char_draw = ImageDraw.Draw(char_temp)
                tx, ty = (tw - w) // 2 - bb[0], (th - h) // 2 - bb[1]
                char_draw.text((tx, ty), display_text, font=current_font, fill=fg)

                if rot != 0 or sx != 0 or sy != 0:
                    if rot != 0:
                        char_temp = char_temp.rotate(rot, resample=Image.BICUBIC, expand=False)
                    if sx != 0 or sy != 0:
                        tw, th = char_temp.size
                        char_temp = char_temp.transform(
                            (tw, th),
                            Image.AFFINE,
                            (1, -sx, sx * (th / 2), -sy, 1, sy * (tw / 2)),
                            resample=Image.BICUBIC,
                        )

                if c_top > 0 or c_bottom > 0 or c_left > 0 or c_right > 0:
                    tw, th = char_temp.size
                    crop_x1 = tx + bb[0] + c_left
                    crop_y1 = ty + bb[1] + c_top
                    crop_x2 = tx + bb[2] - c_right
                    crop_y2 = ty + bb[3] - c_bottom
                    if crop_y1 > 0:
                        char_temp.paste((0, 0, 0, 0), (0, 0, tw, crop_y1))
                    if crop_y2 < th:
                        char_temp.paste((0, 0, 0, 0), (0, crop_y2, tw, th))
                    if crop_x1 > 0:
                        char_temp.paste((0, 0, 0, 0), (0, 0, crop_x1, th))
                    if crop_x2 < tw:
                        char_temp.paste((0, 0, 0, 0), (crop_x2, 0, tw, th))

                char_img = char_temp.crop((tx + bb[0], ty + bb[1], tx + bb[2], ty + bb[3]))

                # Unconditional variable declarations
                studio_font = ImageFont.truetype(font_path, int(100 * scale))
                studio_bb = studio_font.getbbox(display_text)
                cw_studio, ch_studio = studio_bb[2] - studio_bb[0], studio_bb[3] - studio_bb[1]
                bbox_x = (400 - (cw_studio + 200)) // 2 + override.get("x_offset", 0) + 100
                bbox_y = studio_y_cursor + override.get("y_offset", 0) + 100

                c_mask = override.get("mask")
                if c_mask:
                    try:
                        import base64
                        mask_data = base64.b64decode(c_mask.split(',')[1])
                        mask_img = Image.open(io.BytesIO(mask_data)).convert("L")
                        char_mask = mask_img.crop((x_pos, y_pos, x_pos + char_img.width, y_pos + char_img.height))
                        new_alpha = char_mask.point(lambda x: 0 if x < 128 else 255, 'L')
                        orig_a = char_img.getchannel('A')
                        char_img.putalpha(ImageChops.darker(orig_a, new_alpha))
                    except Exception as exc:
                        print(f"Char mask error: {exc}")

                c_adjs = override.get("adjustments")
                if c_adjs:
                    try:
                        for adj in c_adjs:
                            lx = adj['x'] - bbox_x
                            ly = adj['y'] - bbox_y
                            low, loh = adj['ow'], adj['oh']
                            ldx, ldy = adj['dx'], adj['dy']

                            part = char_img.crop((lx, ly, lx + low, ly + loh))
                            if adj.get('mode') == 'move':
                                char_img.paste((0, 0, 0, 0), (int(lx), int(ly), int(lx + low), int(ly + loh)))
                            if adj.get('mode') == 'extend' and adj.get('fw') and adj.get('fh'):
                                part = part.resize((int(abs(adj['fw'])), int(abs(adj['fh']))), Image.Resampling.LANCZOS)
                            char_img.paste(part, (int(lx + ldx), int(ly + ldy)), part)
                    except Exception as exc:
                        print(f"Char adj error: {exc}")

                xb = (estimated_w - char_img.width) // 2
                lig_layer.paste(char_img, (xb + x_off, lig_y_cursor + y_off), char_img)

                y_adv = override.get("y_advance")
                if y_adv is not None:
                    lig_y_cursor += int(y_adv * scale_factor)
                    studio_y_cursor += int(y_adv)
                else:
                    lig_y_cursor += line_height + req.line_spacing
                    studio_y_cursor += ch_studio + 20

            l_bbox = lig_layer.getbbox()
            final_img = lig_layer.crop(l_bbox) if l_bbox else Image.new("RGBA", (1, 1), (0, 0, 0, 0))
            
            # Detect primary stem bounds on original nitya font
            stem_start_x, stem_end_x = find_rightmost_stem_bounds(final_img)
            stem_center_x = (stem_start_x + stem_end_x) // 2
            prepared_items.append({
                "type": "ligature",
                "img": final_img,
                "stem_start_x": stem_start_x,
                "stem_end_x": stem_end_x,
                "stem_center_x": stem_center_x,
                "is_double": False,
                "x_offset": 0,
                "y_offset": 0,
                "text": line
            })
            left_extents.append(stem_center_x)
            right_extents.append(final_img.width - stem_center_x)

        else:
            base_char = line.replace('्', '').strip()
            for matra_char in ['ा', 'ि', 'ी', 'ु', 'ू', 'े', 'ै', 'ो', 'ौ']:
                base_char = base_char.replace(matra_char, '')

            char_conf = configs.get(base_char, {})

            if i == 0:
                priority = ["first", "full"]
            elif i == len(merged_lines) - 1:
                priority = ["last", "full"]
            else:
                priority = ["middle", "full"]

            override = {}
            for p in priority:
                if p in char_conf:
                    override = char_conf[p]
                    break

            display_text = line
            scale_factor = req.font_size / 120.0
            scale = override.get("scale", 1.0)
            x_off = int(override.get("x_offset", 0) * scale_factor)
            y_off = int(override.get("y_offset", 0) * scale_factor)
            rot = override.get("rotation", 0.0)
            sx = override.get("skew_x", 0.0)
            sy = override.get("skew_y", 0.0)
            c_top = int(override.get("crop_top", 0) * scale_factor)
            c_bottom = int(override.get("crop_bottom", 0) * scale_factor)
            c_left = int(override.get("crop_left", 0) * scale_factor)
            c_right = int(override.get("crop_right", 0) * scale_factor)

            current_font = font
            if scale != 1.0:
                current_font = ImageFont.truetype(font_path, int(req.font_size * scale))

            bb = current_font.getbbox(display_text)
            w, h = bb[2] - bb[0], bb[3] - bb[1]
            tw, th = w + 100, h + 100
            temp_layer = Image.new("RGBA", (tw, th), color=(0, 0, 0, 0))
            temp_draw = ImageDraw.Draw(temp_layer)
            tx, ty = (tw - w) // 2 - bb[0], (th - h) // 2 - bb[1]
            temp_draw.text((tx, ty), display_text, font=current_font, fill=fg)

            if rot != 0 or sx != 0 or sy != 0:
                if rot != 0:
                    temp_layer = temp_layer.rotate(rot, resample=Image.BICUBIC, expand=False)
                if sx != 0 or sy != 0:
                    tw_layer, th_layer = temp_layer.size
                    temp_layer = temp_layer.transform(
                        (tw_layer, th_layer),
                        Image.AFFINE,
                        (1, -sx, sx * (th_layer / 2), -sy, 1, sy * (tw_layer / 2)),
                        resample=Image.BICUBIC,
                    )

            if c_top > 0 or c_bottom > 0 or c_left > 0 or c_right > 0:
                tw_layer, th_layer = temp_layer.size
                crop_x1 = tx + bb[0] + c_left
                crop_y1 = ty + bb[1] + c_top
                crop_x2 = tx + bb[2] - c_right
                crop_y2 = ty + bb[3] - c_bottom
                if crop_y1 > 0:
                    temp_layer.paste((0, 0, 0, 0), (0, 0, tw_layer, crop_y1))
                if crop_y2 < th_layer:
                    temp_layer.paste((0, 0, 0, 0), (0, crop_y2, tw_layer, th_layer))
                if crop_x1 > 0:
                    temp_layer.paste((0, 0, 0, 0), (0, 0, crop_x1, th_layer))
                if crop_x2 < tw_layer:
                    temp_layer.paste((0, 0, 0, 0), (crop_x2, 0, tw_layer, th_layer))

            cluster_img = temp_layer.crop((tx + bb[0], ty + bb[1], tx + bb[2], ty + bb[3]))
            
            # Detect rightmost stem bounds using specified scanning method on the glyph image (avoiding nitya font head)
            stem_start_x, stem_end_x = find_rightmost_stem_bounds(cluster_img)
            stem_center_x = (stem_start_x + stem_end_x) // 2
            
            # Separate single and double stems directly from the hardcoded dictionary
            is_double = base_char in DOUBLE_STEM_CHARS

            prepared_items.append({
                "type": "char",
                "img": cluster_img,
                "font_bb": bb,
                "stem_start_x": stem_start_x,
                "stem_end_x": stem_end_x,
                "stem_center_x": stem_center_x,
                "is_double": is_double,
                "x_offset": x_off,
                "y_off_local": y_off,
                "x_off": x_off,
                "y_offset": y_off,
                "text": display_text
            })
            left_extents.append(stem_center_x)
            right_extents.append(cluster_img.width - stem_center_x)

    # ----------------- PHASE 2: RESTORED ORIGINAL CENTERING & LAYOUT Math -----------------
    total_width = max(line_widths) if line_widths else req.font_size
    
    # Calculate cumulative dynamic shift using: shift_offset = (letter_width / 2.0) - (stem_width / 2.0)
    max_possible_shift = 0
    for idx, item in enumerate(prepared_items):
        if item["is_double"] and idx > 0:
            letter_width = item["img"].width
            stem_width = item["stem_end_x"] - item["stem_start_x"]
            shift_offset = int((letter_width / 2.0) - (stem_width / 2.0))
            max_possible_shift += max(0, shift_offset)
    
    safety_top = int(req.font_size * 0.15)
    img_w = total_width + max_possible_shift + req.padding * 2
    img_h = total_rendered_height + req.padding * 2 + safety_top

    img = Image.new("RGBA", (img_w, img_h), color=bg)
    draw_overlay = ImageDraw.Draw(img)

    y_cursor = req.padding + safety_top
    current_visible_bottom = y_cursor
    
    # Track the vertical coordinate from which the next character should be positioned.
    next_start_reference_y = y_cursor
    first_item = True
    first_char_origin_x = None
    first_char_origin_y = None
    first_char_text = None
    last_char_origin_x = None
    last_char_origin_y = None
    last_char_text = None
    
    # Track original horizontal start coordinate of the topmost character's rendering slot
    first_char_paste_x = None

    # Horizontal backbone alignment shift tracker
    backbone_shift_x = 0

    # Array to track stem coordinates on the canvas
    stems_info = []

    for i, item in enumerate(prepared_items):
        cluster_img = item["img"]
        x_off = item["x_offset"]
        y_off = item["y_offset"]

        if item["type"] == "ligature":
            # Reconstruct original ligature layout metrics
            l_bbox = cluster_img.getbbox()
            if l_bbox:
                # Bounding-box horizontal center + dynamic shift offset
                x_base = (total_width - cluster_img.width) // 2
                paste_x = req.padding + x_base + x_off + backbone_shift_x

                if first_item:
                    paste_y = y_cursor
                    first_item = False
                else:
                    paste_y = next_start_reference_y + req.line_spacing - l_bbox[1]

                img.paste(cluster_img, (paste_x, paste_y), cluster_img)

                # Capture stem metric
                abs_start = paste_x + item["stem_start_x"]
                abs_end = paste_x + item["stem_end_x"]
                stems_info.append({
                    "stem_start_x": abs_start,
                    "stem_end_x": abs_end,
                    "top": paste_y + l_bbox[1],
                    "bottom": paste_y + l_bbox[3]
                })
                
                # Default baseline tracking
                next_start_reference_y = paste_y + l_bbox[3]
                current_visible_bottom = paste_y + l_bbox[3]

                # Robust ligature-aware first/last tracking
                if first_char_origin_x is None:
                    first_char_origin_x = paste_x
                    first_char_origin_y = paste_y
                    first_char_text = item["text"].split('+')[0] if '+' in item["text"] else item["text"]
                last_char_origin_x = paste_x
                last_char_origin_y = paste_y
                last_char_text = item["text"].split('+')[-1] if '+' in item["text"] else item["text"]
                
                # Record the horizontal start of the topmost character
                if i == 0:
                    first_char_paste_x = paste_x

            # Process potential ligature double-stem rule (only if it is not the first character)
            if item["is_double"] and i > 0:
                half_letter = cluster_img.width / 2.0
                stem_width = item["stem_end_x"] - item["stem_start_x"]
                half_stem = stem_width / 2.0
                shift_offset = int(half_letter - half_stem)
                backbone_shift_x += shift_offset

            continue

        # Regular Character Layer Layout
        actual_bbox = cluster_img.getbbox()
        if actual_bbox:
            # Exact original centering logic + dynamic shift offset
            font_bb = item["font_bb"]
            x_base = (total_width - (font_bb[2] - font_bb[0])) // 2
            paste_x = req.padding + x_base + x_off + backbone_shift_x

            if first_item:
                paste_y = y_cursor + y_off
                first_item = False
            else:
                # Place relative to our vertical starting reference coordinate
                paste_y = next_start_reference_y + req.line_spacing - actual_bbox[1] + y_off

            # Render the letters in order of original stack
            img.paste(cluster_img, (paste_x, paste_y), cluster_img)

            # Store right stem positions for calligraphic connectors
            stem_start_x = item["stem_start_x"]
            stem_end_x = item["stem_end_x"]

            abs_start = paste_x + stem_start_x
            abs_end = paste_x + stem_end_x

            # Save the stem coordinate metrics
            stems_info.append({
                "stem_start_x": abs_start,
                "stem_end_x": abs_end,
                "top": paste_y + actual_bbox[1],
                "bottom": paste_y + actual_bbox[3]
            })

            # --- ANCHOR THE STARTING REFERENCE POINT FOR THE NEXT LETTER ---
            if item["is_double"]:
                # Identify exact vertical bottom of the rightmost stem
                y_stem_bottom_local = find_stem_vertical_bottom(cluster_img, stem_start_x, stem_end_x)
                
                # FORCE the next letter below the absolute lowest visual pixel of this character
                visual_bottom = actual_bbox[3] if actual_bbox else cluster_img.height
                lowest_safe_point = max(y_stem_bottom_local, visual_bottom)
                
                next_start_reference_y = paste_y + lowest_safe_point

                # Update vertical backbone (backbone_shift_x) ONLY if this is not the first character (i > 0)
                if i > 0:
                    letter_width = actual_bbox[2] - actual_bbox[0]
                    half_letter = letter_width / 2.0
                    stem_width = stem_end_x - stem_start_x
                    half_stem = stem_width / 2.0
                    shift_offset = int(half_letter - half_stem)
                    backbone_shift_x += shift_offset
            else:
                # For single-stem letters, standard baseline bottom is the starting reference point
                next_start_reference_y = paste_y + actual_bbox[3]

            # Check if this character is a double stem character (Rule 6) - Must occur after anchoring maths
            if item["is_double"] and i > 0:
                top_of_starting_letter = y_cursor
                top_of_current_letter = paste_y + actual_bbox[1]

                if top_of_current_letter > top_of_starting_letter:
                    # Extend ONLY the rightmost stem from top of current letter to top of starting letter
                    # Use the local absolute bounds (abs_start, abs_end) without the +1/-1 pinch
                    draw_overlay.rectangle([abs_start, top_of_starting_letter, abs_end, top_of_current_letter], fill=fg)

            if first_char_origin_x is None:
                first_char_origin_x = paste_x - font_bb[0]
                first_char_origin_y = paste_y - font_bb[1]
                first_char_text = item["text"]
            last_char_origin_x = paste_x - font_bb[0]
            last_char_origin_y = paste_y - font_bb[1]
            last_char_text = item["text"]
            
            # Record the horizontal start of the topmost character
            if i == 0:
                first_char_paste_x = paste_x

            current_visible_bottom = paste_y + actual_bbox[3]
        else:
            if not first_item:
                current_visible_bottom += line_height + req.line_spacing

    # ----------------- PHASE 3: ADJACENT PRIMARY CONNECTOR OVERLAYS -----------------
    if len(stems_info) > 1:
        for j in range(1, len(stems_info)):
            prev = stems_info[j-1]
            curr = stems_info[j]

            left_x = curr["stem_start_x"]
            right_x = curr["stem_end_x"]
            top_y = prev["bottom"]
            bottom_y = curr["top"]

            if bottom_y > top_y:
                # Use local left_x and right_x without the +1/-1 pinch
                draw_overlay.rectangle([left_x, top_y, right_x, bottom_y], fill=fg)

    # ----------------- PHASE 4: APPLY MATRAS -----------------
    if final_matras:
        stack_bbox = img.getbbox()
        if stack_bbox:
            s_top, s_bottom = stack_bbox[1], stack_bbox[3]
            s_left, s_right = stack_bbox[0], stack_bbox[2]
            s_h = s_bottom - s_top
            s_w = s_right - s_left

            mfont = ImageFont.truetype(font_path, req.font_size)
            tw, th = 500, 500

            def _get_matra_bbox_and_glyph(base_char, matra_char, pos='right'):
                if not base_char or pos == 'below':
                    base_char = 'क'

                if pos == 'left':
                    temp_s = Image.new('RGBA', (tw, th), (0, 0, 0, 0))
                    ImageDraw.Draw(temp_s).text((100, 100), matra_char, font=mfont, fill=fg)
                    bb_s = temp_s.getbbox()
                    if bb_s:
                        s_pix = temp_s.load()
                        col_alpha = [sum(s_pix[x, y][3] for y in range(th)) for x in range(tw)]
                        peak_x = max(range(bb_s[0], bb_s[2]), key=lambda x: col_alpha[x])
                        gap_x = bb_s[2]

                        for x in range(peak_x + 1, tw):
                            if col_alpha[x] == 0:
                                gap_x = x
                                break

                        if matra_char == 'ि':
                            import numpy as np
                            from collections import Counter

                            arr = np.array(temp_s)
                            draw = ImageDraw.Draw(temp_s)

                            left_edges = []
                            for y in range(bb_s[1] + 20, bb_s[3]):
                                row = arr[y, bb_s[0]:bb_s[2], 3]
                                nonzero = np.where(row > 0)[0]
                                if len(nonzero) > 0:
                                    left_edges.append(bb_s[0] + nonzero[0])
                            if left_edges:
                                stem_left_x = Counter(left_edges).most_common(1)[0][0]
                                draw.rectangle([(0, bb_s[1] + 20), (int(stem_left_x) - 1, bb_s[3])], fill=(0, 0, 0, 0))

                            dip_x = peak_x
                            min_alpha = col_alpha[peak_x]
                            for x in range(peak_x, bb_s[2]):
                                if col_alpha[x] < min_alpha:
                                    min_alpha = col_alpha[x]
                                    dip_x = x
                                elif col_alpha[x] > min_alpha * 1.5 and col_alpha[x] > 3000:
                                    break

                            arch_bottom_y = bb_s[1]
                            found_top = False
                            for y in range(bb_s[1], bb_s[3]):
                                if s_pix[dip_x, y][3] > 0:
                                    found_top = True
                                elif found_top and s_pix[dip_x, y][3] == 0:
                                    arch_bottom_y = y
                                    break

                            draw.rectangle([(dip_x, arch_bottom_y), (tw, th)], fill=(0, 0, 0, 0))

                            c_alpha = [sum(s_pix[x, y][3] for y in range(th)) for x in range(tw)]
                            end_x = bb_s[2]
                            for x in range(tw - 1, peak_x, -1):
                                if c_alpha[x] > 0:
                                    end_x = x
                                    break
                            gap_x = end_x + 1

                        pure_ikar = Image.new('RGBA', (tw, th), (0, 0, 0, 0))
                        pure_ikar.paste(temp_s.crop((0, 0, gap_x, th)), (0, 0))
                        return pure_ikar.getbbox(), pure_ikar

                text_with = base_char + matra_char
                temp_with = Image.new('RGBA', (tw, th), (0, 0, 0, 0))
                ImageDraw.Draw(temp_with).text((100, 100), text_with, font=mfont, fill=fg)
                temp_ref = Image.new('RGBA', (tw, th), (0, 0, 0, 0))
                ImageDraw.Draw(temp_ref).text((100, 100), base_char, font=mfont, fill=fg)
                diff = ImageChops.difference(temp_with, temp_ref)
                
                return diff.getbbox(), diff

            for matra_char in final_matras:
                shared_matra_pos = MATRA_POS[matra_char]
                shared_matra = matra_char
                matra_bbox_first, temp_with_first = _get_matra_bbox_and_glyph(first_char_text, shared_matra, shared_matra_pos)
                matra_bbox_last, temp_with_last = _get_matra_bbox_and_glyph(last_char_text, shared_matra, shared_matra_pos)

                if shared_matra_pos in ('right', 'left'):
                    # Determine which letter text and bbox to use for the matra shape/offset
                    if shared_matra_pos == 'left':
                        matra_glyph = temp_with_first.crop(matra_bbox_first) if matra_bbox_first else None
                        if matra_glyph:
                            t_x_first = first_char_origin_x - matra_glyph.width + 8 if first_char_origin_x is not None else s_left - matra_glyph.width
                            t_x_last = last_char_origin_x - matra_glyph.width + 8 if last_char_origin_x is not None else s_left - matra_glyph.width
                            
                            paste_x = min(t_x_first, t_x_last)
                            paste_y = first_char_origin_y + (matra_bbox_first[1] - 100)
                    else:  # 'right' matras align dynamically to clear the widest letter using native spacing
                        matra_glyph = temp_with_last.crop(matra_bbox_last) if matra_bbox_last else None
                        if matra_glyph:
                            dx_first = matra_bbox_first[0] - 100 if matra_bbox_first else 0
                            dx_last = matra_bbox_last[0] - 100 if matra_bbox_last else 0
                            
                            t_x_first = (first_char_origin_x + dx_first) if first_char_origin_x is not None else s_right
                            t_x_last = (last_char_origin_x + dx_last) if last_char_origin_x is not None else s_right
                            
                            paste_x = max(t_x_first, t_x_last)
                            
                            # Vertical offset 'dy' still originates from the top first letter's headline
                            dy = matra_bbox_first[1] - 100 if matra_bbox_first else (matra_bbox_last[1] - 100)
                            paste_y = first_char_origin_y + dy

                    if matra_glyph:
                        if last_char_origin_y is not None and matra_bbox_last:
                            target_bottom = last_char_origin_y + (matra_bbox_last[3] - 100)
                        else:
                            target_bottom = s_bottom

                        target_height = target_bottom - paste_y

                        if target_height > matra_glyph.height:
                            split_y1 = int(matra_glyph.height * 0.6)
                            split_y2 = int(matra_glyph.height * 0.9)

                            top_part = matra_glyph.crop((0, 0, matra_glyph.width, split_y1))
                            mid_part = matra_glyph.crop((0, split_y1, matra_glyph.width, split_y2))
                            bot_part = matra_glyph.crop((0, split_y2, matra_glyph.width, matra_glyph.height))

                            target_mid_h = target_height - top_part.height - bot_part.height
                            if target_mid_h > 0:
                                mid_scaled = mid_part.resize((matra_glyph.width, target_mid_h), Image.Resampling.LANCZOS)
                                scaled = Image.new('RGBA', (matra_glyph.width, target_height), (0, 0, 0, 0))
                                scaled.paste(top_part, (0, 0))
                                scaled.paste(mid_scaled, (0, split_y1))
                                scaled.paste(bot_part, (0, split_y1 + target_mid_h))
                            else:
                                scaled = matra_glyph.resize((matra_glyph.width, target_height), Image.Resampling.LANCZOS)
                        else:
                            scaled = matra_glyph.resize((matra_glyph.width, max(1, target_height)), Image.Resampling.LANCZOS)

                        if paste_x < 0:
                            shift_x = -paste_x + req.padding
                            ni = Image.new('RGBA', (img.width + shift_x, img.height), bg)
                            ni.paste(img, (shift_x, 0))
                            img = ni
                            paste_x = req.padding
                            s_left += shift_x
                            s_right += shift_x
                            if first_char_origin_x is not None:
                                first_char_origin_x += shift_x
                            if last_char_origin_x is not None:
                                last_char_origin_x += shift_x
                            if first_char_paste_x is not None:
                                first_char_paste_x += shift_x
                            # Horizontally shift the recorded stem coordinates to keep them synchronized
                            for stem in stems_info:
                                stem["stem_start_x"] += shift_x
                                stem["stem_end_x"] += shift_x

                        need_w = paste_x + scaled.width
                        if need_w > img.width:
                            ni = Image.new('RGBA', (need_w, img.height), bg)
                            ni.paste(img, (0, 0))
                            img = ni
                        
                        img.paste(scaled, (paste_x, paste_y), scaled)

                elif shared_matra_pos == 'below':
                    matra_glyph_l = temp_with_last.crop(matra_bbox_last) if matra_bbox_last else None
                    if matra_glyph_l:
                        dx_l = matra_bbox_last[0] - 100
                        dy_l = matra_bbox_last[1] - 100
                        if last_char_origin_x is not None:
                            paste_x = last_char_origin_x + dx_l
                            paste_y = last_char_origin_y + dy_l
                        else:
                            paste_x = s_left + (s_w - matra_glyph_l.width) // 2
                            paste_y = s_bottom + 2

                        need_h = paste_y + matra_glyph_l.height + 4
                        if need_h > img.height:
                            ni = Image.new('RGBA', (img.width, need_h), bg)
                            ni.paste(img, (0, 0))
                            img = ni
                        img.paste(matra_glyph_l, (paste_x, paste_y), matra_glyph_l)

                elif shared_matra_pos == 'above':
                    matra_glyph_f = temp_with_first.crop(matra_bbox_first) if matra_bbox_first else None
                    if matra_glyph_f:
                        dx_f = mfont.getbbox(matra_char)[0] - 100 if mfont.getbbox(matra_char) else matra_bbox_first[0] - 100
                        dy_f = matra_bbox_first[1] - 100
                        if first_char_origin_x is not None:
                            paste_x = first_char_origin_x + dx_f
                            paste_y = first_char_origin_y + dy_f
                        else:
                            paste_x = s_left + (s_w - matra_glyph_f.width) // 2
                            paste_y = s_top - matra_glyph_f.height - 2

                        if paste_y < 0:
                            shift = -paste_y + 2
                            ni = Image.new('RGBA', (img.width, img.height + shift), bg)
                            ni.paste(img, (shift, 0))
                            img = ni
                            paste_y = 0
                            s_top += shift
                            s_bottom += shift
                            if first_char_origin_y is not None:
                                first_char_origin_y += shift
                            if last_char_origin_y is not None:
                                last_char_origin_y += shift
                        img.paste(matra_glyph_f, (paste_x, paste_y), matra_glyph_f)

    # ----------------- PHASE 4.5: EXTRACT & STRETCH MIDDLE SHIROREKHA SECTION TO END POINT -----------------
    word_bbox = img.getbbox()
    if word_bbox and stems_info and first_char_paste_x is not None:
        first_img = prepared_items[0]["img"]
        headline_thickness = max(4, int(req.font_size * 0.12))
        
        # 1. Define split points for the 3 sections of the topmost character's shirorekha
        split_x1 = int(first_img.width * 0.33)
        split_x2 = int(first_img.width * 0.66)
        
        # 2. Detect the end point of the rightmost stem of the word
        # We do this by scanning the alpha channel from right to left (starting at word_bbox[2] - 1)
        # to find the first column with substantial vertical ink concentration (representing a vertical stem)
        arr = np.array(img)
        h, w, c = arr.shape
        
        # Create a robust ink mask that works for both transparent and opaque backgrounds
        if transparent:
            ink_mask = arr[:, :, 3] > 50
        else:
            bg_rgb = np.array(bg[:3])
            diff = np.abs(arr[:, :, :3] - bg_rgb)
            ink_mask = np.sum(diff, axis=2) > 15
            
        rightmost_stem_x = None
        scan_start = word_bbox[2] - 1
        scan_end = first_char_paste_x + split_x2
        
        # Define a robust threshold for a vertical stem (at least 25% of font size height)
        vertical_stem_threshold = max(10, int(req.font_size * 0.25))
        
        for col in range(scan_start, scan_end, -1):
            if col < w:
                ink_count = np.sum(ink_mask[:, col])
                if ink_count >= vertical_stem_threshold:
                    rightmost_stem_x = col
                    break
                    
        # Fallback to word_bbox[2] if no stem column is detected (safety guard)
        x_end = rightmost_stem_x if rightmost_stem_x is not None else word_bbox[2]
        
        # 3. Calculate target width for stretching ONLY the middle segment
        # The rightmost section of the original shirorekha has a width of (first_img.width - split_x2)
        original_right_w = first_img.width - split_x2
        
        # In the new layout, the unextended rightmost section must end exactly at x_end (the rightmost stem)
        paste_right_x = x_end - original_right_w
        
        # The stretched middle section starts at (first_char_paste_x + split_x1) and ends at paste_right_x
        x_mid_start = first_char_paste_x + split_x1
        target_mid_w = paste_right_x - x_mid_start
        
        # Only stretch if the new middle section width is larger than the original middle section width
        original_mid_w = split_x2 - split_x1
        if target_mid_w > original_mid_w:
            # Crop the middle section from the topmost character's image
            mid_sec = first_img.crop((split_x1, 0, split_x2, headline_thickness))
            
            # Crop the unstretched right section (preserving its native calligraphic terminal/serif)
            right_sec = first_img.crop((split_x2, 0, first_img.width, headline_thickness))
            
            # Stretch the middle section horizontally using LANCZOS resampling to prevent pixelation/blur
            extended_mid_sec = mid_sec.resize((target_mid_w, headline_thickness), Image.Resampling.LANCZOS)
            
            # Use the vertical coordinate (height level) of the first character's shirorekha
            shirorekha_y = stems_info[0]["top"]
            
            # Paste the extended middle section
            img.paste(extended_mid_sec, (x_mid_start, shirorekha_y), extended_mid_sec)
            
            # Paste the native unstretched right section at the very end
            img.paste(right_sec, (paste_right_x, shirorekha_y), right_sec)

    # ----------------- PHASE 5: FINAL CROP -----------------
    if transparent:
        final_bbox = img.getbbox()
    else:
        # If the background is solid, getbbox() will return the entire image.
        # We find the true bounding box by checking the difference from a blank background.
        bg_reference = Image.new("RGBA", img.size, bg)
        diff = ImageChops.difference(img, bg_reference)
        final_bbox = diff.getbbox()

    if final_bbox:
        # Dynamically crop excess whitespace horizontally and vertically
        crop_left = max(0, final_bbox[0] - req.padding)
        crop_top = max(0, final_bbox[1] - req.padding)
        crop_right = min(img.width, final_bbox[2] + req.padding)
        crop_bottom = min(img.height, final_bbox[3] + req.padding)
        img = img.crop((crop_left, crop_top, crop_right, crop_bottom))

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png", headers={"Content-Disposition": 'inline; filename="ranjana_monogram.png"'})

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("monogram:app", host="0.0.0.0", port=8001, reload=False)