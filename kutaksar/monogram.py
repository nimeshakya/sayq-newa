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

CLUSTER_REGEX = r'[\u0915-\u0939\u0958-\u095F][\u094D]?[\u093E-\u094C\u0901-\u0903\u0951-\u0957\u0962-\u0963]?|[\u0905-\u0914]'


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


# l
import numpy as np

# Hardcoded classifications as defined by your structural rules
DOUBLE_STEM_CHARS = {
    "ख", "ग", "घ", "ङ", "झ", "ण", "थ", "ध", "प", "फ", "भ", "म", "य", "श", "ष", "स"
}

def find_stems_by_scanning(char_img: Image.Image) -> tuple[int, int, Optional[tuple[int, int]]]:
    """
    Scans the character image columns from right-to-left.
    Focuses on the very top of the cropped character (to avoid the head),
    identifies the rightmost stem bounds first, then skips it and locates
    the second stem (left stem) bounds using the exact color start and end transitions.
    """
    if char_img.mode != "RGBA":
        char_img = char_img.convert("RGBA")
        
    arr = np.array(char_img)
    h, w, c = arr.shape
    if h == 0 or w == 0:
        return int(w * 0.75), int(w * 0.85), None

    # Step 1: Move to the top of the letter first (find the first visible pixel row)
    top_row = 0
    for y in range(h):
        if np.any(arr[y, :, 3] > 30):
            top_row = y
            break
            
    # Step 2: Scan a thin horizontal slice of 6 rows at the top of the cropped letter
    start_row = top_row
    end_row = min(h, top_row + 6)
    
    top_slice_alpha = arr[start_row:end_row, :, 3]
    col_sums = np.sum(top_slice_alpha, axis=0)
    
    # Establish a clean noise threshold (column must be at least 15% solid ink)
    max_possible_sum = 255 * (end_row - start_row)
    threshold = max_possible_sum * 0.15

    # Step 3: Find the first (rightmost) color portion
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
        # Keep moving left until this first color portion ends
        col = primary_end_x
        while col >= 0:
            if col_sums[col] < threshold:
                primary_start_x = col + 1
                break
            col -= 1
        if primary_start_x is None:
            primary_start_x = 0
            
    # Step 4: "dont detect the first color portion of the whole word" -> Keep moving left to find the second color portion
    secondary_end_x = None
    secondary_start_x = None
    
    if primary_start_x is not None:
        col = primary_start_x - 1
        # Find where the second color starts
        while col >= 0:
            if col_sums[col] >= threshold:
                secondary_end_x = col
                break
            col -= 1
            
        if secondary_end_x is not None:
            # Keep moving left until the second color portion ends (stop immediately when color ends)
            col = secondary_end_x
            while col >= 0:
                if col_sums[col] < threshold:
                    secondary_start_x = col + 1
                    break
                col -= 1
            if secondary_start_x is None:
                secondary_start_x = 0

    # Ensure clean fallback if primary stem was not found
    if primary_end_x is None:
        thickness = max(4, int(w * 0.08))
        primary_end_x = int(w * 0.85)
        primary_start_x = max(0, primary_end_x - thickness)

    secondary_bounds = None
    if secondary_end_x is not None and secondary_start_x is not None:
        # Enforce minimum thickness bounds for secondary stem
        if secondary_end_x - secondary_start_x < 3:
            mid = (secondary_start_x + secondary_end_x) // 2
            half_thick = max(2, int(w * 0.04))
            secondary_start_x = max(0, mid - half_thick)
            secondary_end_x = min(w, mid + half_thick)
        secondary_bounds = (secondary_start_x, secondary_end_x)

    return int(primary_start_x), int(primary_end_x), secondary_bounds


def find_right_stem_bounds(char_img: Image.Image) -> tuple[int, int]:
    """
    Backwards compatibility alias using the scan-based detection.
    """
    p_start, p_end, _ = find_stems_by_scanning(char_img)
    return p_start, p_end


def find_right_stem_x(char_img: Image.Image) -> int:
    """
    Backwards compatibility alias using the scan-based detection.
    """
    p_start, p_end, _ = find_stems_by_scanning(char_img)
    return (p_start + p_end) // 2



# l



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


class MonogramRequest(BaseModel):
    text: str
    font_size: int = 80
    fg_color: str = "#2d1b69"
    bg_color: Optional[str] = "#ffffff"  # None = transparent
    padding: int = 40
    line_spacing: int = 0
    vertical: bool = True
    use_overrides: bool = True

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
    # Reuse monogram logic for a single char
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
        if req.type == "half" and not display_char.endswith('\u094D'):
            display_char += '\u094D'

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

    # Calculate canvas size based on sequence
    # Use a generous vertical space
    img_h = 200 + (len(req.chars) * (font_size + 20))
    img = Image.new("RGBA", (400, img_h), color=(255, 255, 255, 0))
    
    y_cursor = 50
    ascent, descent = font.getmetrics()
    line_height = ascent + descent

    for c in req.chars:
        # Standard sequential rendering with surgical hooks
        try:
            # 1. Render base character glyph
            char_font = ImageFont.truetype(font_path, int(font_size * c.scale))
            # Get bbox for centering
            bb = char_font.getbbox(c.char)
            cw, ch = bb[2] - bb[0], bb[3] - bb[1]
            
            # Create a layer for this character
            # Add padding for rotation/skewing/stretching
            char_layer = Image.new("RGBA", (cw + 200, ch + 200), (0,0,0,0))
            char_draw = ImageDraw.Draw(char_layer)
            # Render at fixed offset
            char_draw.text((100 - bb[0], 100 - bb[1]), c.char, font=char_font, fill=(45, 27, 105, 255))
            
            # 4. Standard Transforms
            # Skewing
            if c.skew_x != 0 or c.skew_y != 0:
                cw_layer, ch_layer = char_layer.size
                char_layer = char_layer.transform(
                    (cw_layer, ch_layer),
                    Image.AFFINE,
                    (1, -c.skew_x, c.skew_x * (ch_layer/2), -c.skew_y, 1, c.skew_y * (cw_layer/2)),
                    Image.Resampling.BICUBIC
                )

            if c.rotation != 0:
                char_layer = char_layer.rotate(c.rotation, expand=True, resample=Image.Resampling.BICUBIC)
            
            if any([c.crop_top, c.crop_bottom, c.crop_left, c.crop_right]):
                bbox = char_layer.getbbox()
                if bbox:
                    bl, bt, br, bb_y = bbox
                    cw_layer, ch_layer = char_layer.size
                    if c.crop_top > 0:
                        char_layer.paste((0,0,0,0), (0, 0, cw_layer, bt + c.crop_top))
                    if c.crop_bottom > 0:
                        char_layer.paste((0,0,0,0), (0, bb_y - c.crop_bottom, cw_layer, ch_layer))
                    if c.crop_left > 0:
                        char_layer.paste((0,0,0,0), (0, 0, bl + c.crop_left, ch_layer))
                    if c.crop_right > 0:
                        char_layer.paste((0,0,0,0), (br - c.crop_right, 0, cw_layer, ch_layer))

            # 5. Calculate final position
            x_pos = (400 - char_layer.width) // 2 + c.x_offset
            y_pos = y_cursor + c.y_offset

            # 6. Apply Per-Char Surgical Mask (Eraser) using final coordinates
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

            # 7. Apply Per-Char Manual Adjustments (Cut/Move/Extend) using final coordinates
            if c.adjustments:
                try:
                    for adj in c.adjustments:
                        lx = adj['x'] - x_pos
                        ly = adj['y'] - y_pos
                        low = adj['ow']
                        loh = adj['oh']
                        ldx = adj['dx']
                        ldy = adj['dy']
                        
                        part = char_layer.crop((lx, ly, lx + low, ly + loh))
                        if adj.get('mode') == 'move':
                            char_layer.paste((0,0,0,0), (int(lx), int(ly), int(lx+low), int(ly+loh)))
                        if adj.get('mode') == 'extend' and adj.get('fw') and adj.get('fh'):
                            part = part.resize((int(abs(adj['fw'])), int(abs(adj['fh']))), Image.Resampling.LANCZOS)
                        char_layer.paste(part, (int(lx+ldx), int(ly+ldy)), part)
                except Exception as e:
                    print(f"Char adj error: {e}")

            # Finally composite into main image
            img.paste(char_layer, (x_pos, y_pos), char_layer)
            
            # Advance
            if c.y_advance:
                y_cursor += c.y_advance
            else:
                y_cursor += (ch + 20) # Default
        except Exception as e:
            print(f"Layer failed: {e}")

    # Do not crop tightly to prevent coordinate shifting for surgical tools
    bbox = img.getbbox()
    if not bbox:
        img = Image.new("RGBA", (400, 200), (0,0,0,0))

    # Apply Global Mask (Legacy)
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
                # adj: {x, y, ow, oh, fw, fh, dx, dy, mode}
                # Capture the part
                part = img.crop((adj['x'], adj['y'], adj['x']+adj['ow'], adj['y']+adj['oh']))
                
                # If mode is 'move', erase the source (Cut)
                if adj.get('mode') == 'move':
                    draw = ImageDraw.Draw(img)
                    draw.rectangle([adj['x'], adj['y'], adj['x']+adj['ow'], adj['y']+adj['oh']], fill=(0,0,0,0))
                
                # If mode is 'extend', stretch the part
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
    # Render the ligature
    resp = await preview_ligature(req)
    if isinstance(resp, dict) and "error" in resp:
        return resp
    
    # Read the image back
    img_data = b"".join([chunk async for chunk in resp.body_iterator])
    img = Image.open(io.BytesIO(img_data))
    
    # Training sample: white background
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
    if not re.search(r'[\u0900-\u097F]', text):
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

    i_matra = '\u093F'
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
        '\u093F': 'left',
        '\u0940': 'right',
        '\u093E': 'right',
        '\u0941': 'below',
        '\u0942': 'below',
        '\u0947': 'above',
        '\u0948': 'above',
        '\u094B': 'right',
        '\u094C': 'right',
    }

    present_matras = set()
    for line in lines:
        for matra_char in MATRA_POS.keys():
            if matra_char in line:
                present_matras.add(matra_char)

    final_matras = set()
    if present_matras:
        has_i = '\u093F' in present_matras
        has_ii = '\u0940' in present_matras
        has_aa = '\u093E' in present_matras

        if has_i:
            final_matras.add('\u093F')
        if has_aa and has_ii:
            final_matras.add('\u0940')
        else:
            if has_aa:
                final_matras.add('\u093E')
            if has_ii:
                final_matras.add('\u0940')

        if '\u0941' in present_matras:
            final_matras.add('\u0941')
        elif '\u0942' in present_matras:
            final_matras.add('\u0942')

        for matra_char in ['\u0947', '\u0948', '\u094B', '\u094C']:
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

                # Unconditional variable declarations (prevents scope bugs)
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
                        char_mask = mask_img.crop((bbox_x, bbox_y, bbox_x + char_img.width, bbox_y + char_img.height))
                        new_alpha = char_mask.point(lambda x: 0 if x < 128 else 255, 'L')
                        orig_a = char_img.getchannel('A')
                        char_img.putalpha(ImageChops.darker(orig_a, new_alpha))
                    except Exception as exc:
                        print(f"Mask error: {exc}")

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
                        print(f"Adj error: {exc}")

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
            stem_start_x, stem_end_x, _ = find_stems_by_scanning(final_img)
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
            base_char = line.replace('\u094D', '').strip()
            for matra_char in ['\u093E', '\u093F', '\u0940', '\u0941', '\u0942', '\u0947', '\u0948', '\u094B', '\u094C']:
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
            
            # Detect rightmost and secondary stem bounds using specified scanning method on the glyph image (avoiding nitya font head)
            stem_start_x, stem_end_x, s_bounds = find_stems_by_scanning(cluster_img)
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
                "sec_stem_bounds": s_bounds,
                "is_double": is_double,
                "x_offset": x_off,
                "y_offset": y_off,
                "text": display_text
            })
            left_extents.append(stem_center_x)
            right_extents.append(cluster_img.width - stem_center_x)

    # ----------------- PHASE 2: RESTORED ORIGINAL CENTERING & LAYOUT Math -----------------
    total_width = max(line_widths) if line_widths else req.font_size
    safety_top = int(req.font_size * 0.15)
    img_w = total_width + req.padding * 2
    img_h = total_rendered_height + req.padding * 2 + safety_top

    img = Image.new("RGBA", (img_w, img_h), color=bg)
    draw_overlay = ImageDraw.Draw(img)

    y_cursor = req.padding + safety_top
    current_visible_bottom = y_cursor
    first_item = True
    first_char_origin_x = None
    first_char_origin_y = None
    first_char_text = None
    last_char_origin_x = None
    last_char_origin_y = None
    last_char_text = None

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
                x_base = (total_width - cluster_img.width) // 2
                if first_item:
                    paste_y = y_cursor
                    first_item = False
                else:
                    paste_y = current_visible_bottom + req.line_spacing - l_bbox[1]

                img.paste(cluster_img, (req.padding + x_base, paste_y), cluster_img)

                # Capture stem metric
                abs_start = req.padding + x_base + item["stem_start_x"]
                abs_end = req.padding + x_base + item["stem_end_x"]
                stems_info.append({
                    "stem_start_x": abs_start,
                    "stem_end_x": abs_end,
                    "top": paste_y + l_bbox[1],
                    "bottom": paste_y + l_bbox[3]
                })
                current_visible_bottom = paste_y + l_bbox[3]
            continue

        # Regular Character Layer Layout
        actual_bbox = cluster_img.getbbox()
        if actual_bbox:
            # Exact original centering logic
            font_bb = item["font_bb"]
            x_base = (total_width - (font_bb[2] - font_bb[0])) // 2

            if first_item:
                paste_y = y_cursor + y_off
                first_item = False
            else:
                paste_y = current_visible_bottom + req.line_spacing - actual_bbox[1] + y_off

            # Render the letters in order of original stack (Rule 4)
            img.paste(cluster_img, (req.padding + x_base + x_off, paste_y), cluster_img)

            # Store right stem positions for calligraphic connectors
            stem_start_x = item["stem_start_x"]
            stem_end_x = item["stem_end_x"]
            s_bounds = item["sec_stem_bounds"]

            abs_start = req.padding + x_base + x_off + stem_start_x
            abs_end = req.padding + x_base + x_off + stem_end_x

            # Save the stem coordinate metrics
            stems_info.append({
                "stem_start_x": abs_start,
                "stem_end_x": abs_end,
                "top": paste_y + actual_bbox[1],
                "bottom": paste_y + actual_bbox[3]
            })

            # Check if this character is a double stem character (Rule 6)
            if item["is_double"] and i > 0:
                top_of_starting_letter = y_cursor
                top_of_current_letter = paste_y + actual_bbox[1]

                if top_of_current_letter > top_of_starting_letter:
                    # Extend ONLY the rightmost stem from top of current letter to top of starting letter
                    # Meet exact inner and outer horizontal bounds of the character's stem width (FWHM adjusted)
                    draw_overlay.rectangle([abs_start + 1, top_of_starting_letter, abs_end - 1, top_of_current_letter], fill=fg)

                    # Also extend the scanned secondary (left) stem continuously up to the top headline
                    if s_bounds is not None:
                        sec_center = (s_bounds[0] + s_bounds[1]) // 2
                        abs_sec_center = req.padding + x_base + x_off + sec_center
                        
                        # Calculate the right stem's native thickness
                        right_thickness = abs_end - abs_start
                        
                        # Draw left stem centered around sec_center with right_thickness
                        abs_sec_start = abs_sec_center - right_thickness // 2
                        abs_sec_end = abs_sec_center + (right_thickness + 1) // 2
                        
                        draw_overlay.rectangle([abs_sec_start + 1, top_of_starting_letter, abs_sec_end - 1, top_of_current_letter], fill=fg)

            if first_char_origin_x is None:
                first_char_origin_x = (req.padding + x_base + x_off) - font_bb[0]
                first_char_origin_y = paste_y - font_bb[1]
                first_char_text = item["text"]
            last_char_origin_x = (req.padding + x_base + x_off) - font_bb[0]
            last_char_origin_y = paste_y - font_bb[1]
            last_char_text = item["text"]

            current_visible_bottom = paste_y + actual_bbox[3]
        else:
            if not first_item:
                current_visible_bottom += line_height + req.line_spacing

    # ----------------- PHASE 3: ADJACENT PRIMARY CONNECTOR OVERLAYS -----------------
    # This closes normal visual gaps for single-stem elements cleanly
    if len(stems_info) > 1:
        for j in range(1, len(stems_info)):
            prev = stems_info[j-1]
            curr = stems_info[j]

            left_x = curr["stem_start_x"]
            right_x = curr["stem_end_x"]
            top_y = prev["bottom"]
            bottom_y = curr["top"]

            if bottom_y > top_y:
                draw_overlay.rectangle([left_x + 1, top_y, right_x - 1, bottom_y], fill=fg)

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
                    base_char = '\u0915'

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

                        if matra_char == '\u093F':
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
                    matra_glyph = temp_with_first.crop(matra_bbox_first) if matra_bbox_first else None
                    if matra_glyph:
                        dx = matra_bbox_first[0] - 100
                        dy = matra_bbox_first[1] - 100
                        if first_char_origin_x is not None:
                            if shared_matra_pos == 'left':
                                paste_x = first_char_origin_x - matra_glyph.width + 8
                            else:
                                paste_x = first_char_origin_x + dx
                            paste_y = first_char_origin_y + dy
                        else:
                            paste_x = s_right if shared_matra_pos == 'right' else s_left - matra_glyph.width
                            paste_y = s_top

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
                                mid_scaled = mid_part.resize((matra_glyph.width, target_mid_h), Image.LANCZOS)
                                scaled = Image.new('RGBA', (matra_glyph.width, target_height), (0, 0, 0, 0))
                                scaled.paste(top_part, (0, 0))
                                scaled.paste(mid_scaled, (0, split_y1))
                                scaled.paste(bot_part, (0, split_y1 + target_mid_h))
                            else:
                                scaled = matra_glyph.resize((matra_glyph.width, target_height), Image.LANCZOS)
                        else:
                            scaled = matra_glyph.resize((matra_glyph.width, max(1, target_height)), Image.LANCZOS)

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
                            ni.paste(img, (0, shift))
                            img = ni
                            paste_y = 0
                            s_top += shift
                            s_bottom += shift
                            if first_char_origin_y is not None:
                                first_char_origin_y += shift
                            if last_char_origin_y is not None:
                                last_char_origin_y += shift
                        img.paste(matra_glyph_f, (paste_x, paste_y), matra_glyph_f)

    # ----------------- PHASE 5: FINAL CROP -----------------
    final_bbox = img.getbbox()
    if final_bbox:
        crop_top = max(0, final_bbox[1] - req.padding)
        crop_bottom = min(img.height, final_bbox[3] + req.padding)
        img = img.crop((0, crop_top, img.width, crop_bottom))

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png", headers={"Content-Disposition": 'inline; filename="ranjana_monogram.png"'})











if __name__ == "__main__":
    import uvicorn

    uvicorn.run("monogram:app", host="0.0.0.0", port=8001, reload=False)