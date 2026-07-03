import os
import io
import numpy as np
import joblib
from PIL import Image, ImageDraw, ImageFont, ImageChops
from fastapi import FastAPI, UploadFile, File, BackgroundTasks, Depends, HTTPException, status, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse, Response
from pydantic import BaseModel
from typing import Optional
import json
import data_gen
import train
import hashlib

# Configuration
MODEL_PATH = "ranjana_rf_model.pkl"
CLASSES_PATH = "classes.txt"
DATASET_DIR = "dataset"
GLYPH_CONFIG_PATH = "glyph_configs.json"
LIGATURE_CONFIG_PATH = "ligature_configs.json"

# Build a single transliteration → Devanagari lookup map
DEVANAGARI_MAP = {**data_gen.CONSONANTS, **data_gen.VOWELS, **data_gen.NUMBERS, **data_gen.SYMBOLS}

def load_glyph_configs():
    if os.path.exists(GLYPH_CONFIG_PATH):
        try:
            with open(GLYPH_CONFIG_PATH, "r", encoding="utf-8") as f:
                content = f.read().strip()
                if not content:  # File is empty
                    return {}
                return json.loads(content)
        except (json.JSONDecodeError, IOError) as e:
            print(f"Warning: Failed to load glyph configs: {e}. Returning empty dict.")
            return {}
    return {}

def save_glyph_configs(configs):
    try:
        with open(GLYPH_CONFIG_PATH, "w", encoding="utf-8") as f:
            json.dump(configs, f, ensure_ascii=False, indent=2)
    except IOError as e:
        print(f"Error saving glyph configs: {e}")
        raise

def load_ligature_configs():
    if os.path.exists(LIGATURE_CONFIG_PATH):
        try:
            with open(LIGATURE_CONFIG_PATH, "r", encoding="utf-8") as f:
                content = f.read().strip()
                if not content:  # File is empty
                    return {}
                return json.loads(content)
        except (json.JSONDecodeError, IOError) as e:
            print(f"Warning: Failed to load ligature configs: {e}. Returning empty dict.")
            return {}
    return {}

def save_ligature_configs(configs):
    try:
        with open(LIGATURE_CONFIG_PATH, "w", encoding="utf-8") as f:
            json.dump(configs, f, ensure_ascii=False, indent=2)
    except IOError as e:
        print(f"Error saving ligature configs: {e}")
        raise

# Regex for Devanagari grapheme clusters:
# Consonant follow by any number of (Virama + Consonant) and optional (Vowel Sign or other modifiers)
# Or a standalone Vowel
# Standard Devanagari Range: \u0900-\u097F
# Consonants: \u0915-\u0939, \u0958-\u095F
# Vowels: \u0905-\u0914
# Virama: \u094D
CLUSTER_REGEX = r'[\u0915-\u0939\u0958-\u095F][\u094D]?[\u093E-\u094C\u0901-\u0903\u0951-\u0957\u0962-\u0963]?|[\u0905-\u0914]'

ADMIN_CONFIG_PATH = "admin_config.json"
DEFAULT_PASSWORD = "leoshreeram7777"

def get_admin_password_hash():
    if os.path.exists(ADMIN_CONFIG_PATH):
        try:
            with open(ADMIN_CONFIG_PATH, "r", encoding="utf-8") as f:
                config = json.load(f)
                return config.get("password_hash")
        except Exception:
            pass
    default_hash = hashlib.sha256(DEFAULT_PASSWORD.encode()).hexdigest()
    save_admin_password_hash(default_hash)
    return default_hash

def save_admin_password_hash(pwd_hash):
    with open(ADMIN_CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump({"password_hash": pwd_hash}, f, indent=2)

app = FastAPI(title="Calligraphic-Python API")

# Enable CORS for frontend integration
# Get allowed origins from environment or use defaults
import os
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "").split(",") if os.getenv("ALLOWED_ORIGINS") else [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://sayq-newa.sauravdhoju.com.np"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_origin_regex="http://localhost.*|http://127\\.0\\.0\\.1.*",
    expose_headers=["*"],
)

class LoginRequest(BaseModel):
    password: str

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

@app.post("/login")
async def login(req: LoginRequest):
    stored_hash = get_admin_password_hash()
    sent_hash = hashlib.sha256(req.password.encode()).hexdigest()
    if sent_hash == stored_hash:
        return {"success": True, "token": req.password}
    else:
        raise HTTPException(status_code=401, detail="Incorrect password")

@app.post("/change-password")
async def change_password(req: ChangePasswordRequest):
    stored_hash = get_admin_password_hash()
    old_hash = hashlib.sha256(req.old_password.encode()).hexdigest()
    if old_hash != stored_hash:
        raise HTTPException(status_code=400, detail="Incorrect old password")
    
    new_hash = hashlib.sha256(req.new_password.encode()).hexdigest()
    save_admin_password_hash(new_hash)
    return {"message": "Password changed successfully"}

# Serve static files
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Configuration
MODEL_PATH = "ranjana_rf_model.pkl"
CLASSES_PATH = "classes.txt"
DATASET_DIR = "dataset"

# In-memory job state
job_state = {
    "generate": {"status": "idle", "message": ""},
    "train": {"status": "idle", "message": "", "accuracy": None},
}

class StatusResponse(BaseModel):
    model_exists: bool
    dataset_exists: bool
    classes_count: int
    dataset_size: int

def get_dataset_info():
    if not os.path.exists(DATASET_DIR):
        return 0, 0
    classes = [d for d in os.listdir(DATASET_DIR) if os.path.isdir(os.path.join(DATASET_DIR, d))]
    total_files = sum([len(files) for r, d, files in os.walk(DATASET_DIR)])
    return len(classes), total_files

@app.get("/")
async def serve_index():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))

@app.get("/status", response_model=StatusResponse)
async def get_status():
    classes_count, dataset_size = get_dataset_info()
    return StatusResponse(
        model_exists=os.path.exists(MODEL_PATH),
        dataset_exists=os.path.exists(DATASET_DIR),
        classes_count=classes_count,
        dataset_size=dataset_size
    )

@app.get("/job/{job_name}")
async def get_job_status(job_name: str):
    if job_name not in job_state:
        return {"error": "Unknown job"}
    return job_state[job_name]

def run_generate():
    job_state["generate"]["status"] = "running"
    job_state["generate"]["message"] = "Generating dataset..."
    try:
        data_gen.create_dataset()
        job_state["generate"]["status"] = "done"
        job_state["generate"]["message"] = "Dataset generated successfully!"
    except Exception as e:
        job_state["generate"]["status"] = "error"
        job_state["generate"]["message"] = str(e)

def run_train():
    job_state["train"]["status"] = "running"
    job_state["train"]["message"] = "Training model..."
    job_state["train"]["accuracy"] = None
    try:
        accuracy = train.train()
        job_state["train"]["status"] = "done"
        job_state["train"]["accuracy"] = accuracy
        job_state["train"]["message"] = f"Training complete! Accuracy: {accuracy:.1%}"
    except Exception as e:
        job_state["train"]["status"] = "error"
        job_state["train"]["message"] = str(e)

@app.post("/generate")
async def generate_data(background_tasks: BackgroundTasks):
    if job_state["generate"]["status"] == "running":
        return {"message": "Generation already running"}
    job_state["generate"]["status"] = "idle"
    background_tasks.add_task(run_generate)
    return {"message": "Data generation started"}

@app.post("/train")
async def train_model(background_tasks: BackgroundTasks):
    if job_state["train"]["status"] == "running":
        return {"message": "Training already running"}
    job_state["train"]["status"] = "idle"
    background_tasks.add_task(run_train)
    return {"message": "Training started"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not os.path.exists(MODEL_PATH) or not os.path.exists(CLASSES_PATH):
        return {"error": "Model not trained yet"}

    # Load model and classes
    model = joblib.load(MODEL_PATH)
    with open(CLASSES_PATH, "r", encoding="utf-8") as f:
        class_names = f.read().splitlines()

    # Read and process image
    contents = await file.read()
    img = Image.open(io.BytesIO(contents)).convert('L')
    img = img.resize((64, 64))
    img_array = np.array(img).flatten() / 255.0
    img_array = img_array.reshape(1, -1)

    # Predict
    prediction = model.predict(img_array)
    probs = model.predict_proba(img_array)
    confidence = float(np.max(probs))
    class_idx = int(prediction[0])
    
    predicted_class = class_names[class_idx]
    devanagari = DEVANAGARI_MAP.get(predicted_class, predicted_class)

    return {
        "predicted_class": predicted_class,
        "devanagari": devanagari,
        "confidence": confidence,
        "all_probs": {class_names[i]: float(probs[0][i]) for i in range(len(class_names))}
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
async def generate_monogram(req: MonogramRequest):
    font_path = "NithyaRanjanaDU-Regular.otf"
    text = req.text.strip()
    if not text:
        return {"error": "No text provided"}

    # Transliterate if it's likely Romanized (no Devanagari chars detected)
    import re
    if not re.search(r'[\u0900-\u097F]', text):
        # We need to re-import or re-calculate DEVANAGARI_MAP because it's static
        # For simplicity, move the conversion logic here
        translit_map = {**data_gen.CONSONANTS, **data_gen.VOWELS, **data_gen.NUMBERS, **data_gen.SYMBOLS}
        matra_map = data_gen.MATRAS
        
        # Sort keys by length descending to match longer ones first (kh, aa, etc)
        keys = sorted(translit_map.keys(), key=len, reverse=True)
        vowel_keys = sorted(data_gen.VOWELS.keys(), key=len, reverse=True)
        
        converted = ""
        i = 0
        last_was_consonant = False
        
        while i < len(text):
            match = False
            # Check for vowel signs if the last character was a consonant
            if last_was_consonant:
                for vk in vowel_keys:
                    if text[i:i+len(vk)] == vk:
                        converted += matra_map.get(vk, data_gen.VOWELS[vk])
                        i += len(vk)
                        match = True
                        last_was_consonant = False # Reset context after a matra
                        break
            
            if not match:
                for k in keys:
                    if text[i:i+len(k)] == k:
                        converted += translit_map[k]
                        i += len(k)
                        match = True
                        # Mark if this was a consonant (but not a halant, though halant+vowel is rare)
                        last_was_consonant = (k in data_gen.CONSONANTS and k != '*')
                        break
            
            if not match:
                converted += text[i]
                i += 1
                last_was_consonant = False
        text = converted

    try:
        font = ImageFont.truetype(font_path, req.font_size)
    except Exception as e:
        return {"error": f"Font load failed: {e}"}

    ascent, descent = font.getmetrics()
    # Adding a small buffer to the line height to be safe
    line_height = ascent + descent
    
        # --- Handle Vertical Stacking with Grapheme Clusters ---
    if req.vertical and "\n" not in text:
        import re
        lines = re.findall(CLUSTER_REGEX, text)
        if not lines: # Fallback if regex fails to match anything for some reason
            lines = list(text)
    else:
        lines = text.split("\n")
    
    # --- Fix for Ranjana Font: Reorder 'i' matra to visual order ---
    # This reorder is only needed for single-line (horizontal) rendering.
    # When vertical stacking is active, the shared matra pre-pass handles it directly.
    i_matra = '\u093F'
    processed_lines = []
    
    for line in lines:
        if i_matra in line:
            # Reorder 'ि' to the start of each cluster for horizontal rendering
            clusters = re.findall(CLUSTER_REGEX, line)
            new_line = ""
            for c in clusters:
                if i_matra in c:
                    new_line += i_matra + c.replace(i_matra, '')
                else:
                    new_line += c
            remaining = line
            for c in clusters:
                remaining = remaining.replace(c, '', 1)
            new_line += remaining
            processed_lines.append(new_line)
        else:
            processed_lines.append(line)
    lines = processed_lines

    # --- Shared Matra Pre-pass ---


    # Strip ALL matras from every cluster and record which matras to render as shared glyphs.


    MATRA_POS = {


        '\u093F': 'left',    # i  ि (Superior in stack)


        '\u0940': 'right',   # ii ी


        '\u093E': 'right',   # aa ा


        '\u0941': 'below',   # u  ु


        '\u0942': 'below',   # uu ू


        '\u0947': 'above',   # e  े


        '\u0948': 'above',   # ai ै


        '\u094B': 'right',   # o  ो


        '\u094C': 'right',   # au ौ


    }


    


    present_matras = set()


    for ln in lines:


        for m_ch in MATRA_POS.keys():


            if m_ch in ln:


                present_matras.add(m_ch)


                


    final_matras = set()


    if present_matras:


        # 1. Left/Right Resolution


        has_i = '\u093F' in present_matras


        has_ii = '\u0940' in present_matras


        has_aa = '\u093E' in present_matras


        


        if has_i: final_matras.add('\u093F')


        if has_aa and has_ii:


            final_matras.add('\u0940') # back ikar overrides aakar


        else:


            if has_aa: final_matras.add('\u093E')


            if has_ii: final_matras.add('\u0940')


            


        # 2. Below Resolution


        if '\u0941' in present_matras:


            final_matras.add('\u0941') # front wukar overrides back wukar


        elif '\u0942' in present_matras:


            final_matras.add('\u0942')


            


        # 3. Other matras (above, etc.)


        for m in ['\u0947', '\u0948', '\u094B', '\u094C']:


            if m in present_matras:


                final_matras.add(m)


                


        lines = [''.join(ch for ch in ln if ch not in MATRA_POS) for ln in lines]

    # --- Pre-process Ligatures ---
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
                seq = "+".join(lines[i:i+length])
                if seq in lig_configs:
                    merged_lines.append({"text": seq, "type": "ligature", "conf": lig_configs[seq]})
                    skip_next = length - 1
                    found_lig = True
                    break
        if not found_lig:
            merged_lines.append({"text": lines[i], "type": "char"})

    # --- Calculate Bounds ---
    line_widths = []
    total_rendered_height = 0
    configs = load_glyph_configs() if req.use_overrides else {}

    for i, item in enumerate(merged_lines):
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

    total_width = max(line_widths) if line_widths else req.font_size
    safety_top = int(req.font_size * 0.15)
    img_w = total_width + req.padding * 2
    img_h = total_rendered_height + req.padding * 2 + safety_top

    # --- Draw ---
    transparent = req.bg_color is None or req.bg_color.lower() == "transparent"
    mode = "RGBA"
    bg = (0, 0, 0, 0) if transparent else (*_hex_to_rgb(req.bg_color), 255)
    img = Image.new(mode, (img_w, img_h), color=bg)
    draw = ImageDraw.Draw(img)
    fg = (*_hex_to_rgb(req.fg_color), 255)
    
    y_cursor = req.padding + safety_top
    current_visible_bottom = y_cursor
    first_item = True
    
    first_char_origin_x = None
    first_char_origin_y = None
    first_char_text = None
    last_char_origin_x = None
    last_char_origin_y = None
    last_char_text = None

    for i, item in enumerate(merged_lines):
        line = item["text"]
        
        if item["type"] == "ligature":
            char_configs = item["conf"]
            # Render ligature to a temporary layer to apply mask correctly
            lig_layer_h = (len(char_configs) * (req.font_size + req.line_spacing)) + 100
            lig_layer = Image.new("RGBA", (total_width + 100, lig_layer_h), (0,0,0,0))
            lig_y_cursor = 0
            studio_y_cursor = 50
            
            for char_idx, override in enumerate(char_configs):
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
                w, h = bb[2]-bb[0], bb[3]-bb[1]
                tw, th = w + 100, h + 100
                char_temp = Image.new("RGBA", (tw, th), color=(0,0,0,0))
                char_draw = ImageDraw.Draw(char_temp)
                tx, ty = (tw - w) // 2 - bb[0], (th - h) // 2 - bb[1]
                char_draw.text((tx, ty), display_text, font=current_font, fill=fg)
                
                if rot != 0 or sx != 0 or sy != 0:
                    if rot != 0:
                        char_temp = char_temp.rotate(rot, resample=Image.BICUBIC, expand=False)
                    if sx != 0 or sy != 0:
                        tw, th = char_temp.size
                        char_temp = char_temp.transform((tw, th), Image.AFFINE, 
                                                         (1, -sx, sx * (th/2), -sy, 1, sy * (tw/2)),
                                                         resample=Image.BICUBIC)
                
                if c_top > 0 or c_bottom > 0 or c_left > 0 or c_right > 0:
                    tw, th = char_temp.size
                    crop_x1 = tx + bb[0] + c_left
                    crop_y1 = ty + bb[1] + c_top
                    crop_x2 = tx + bb[2] - c_right
                    crop_y2 = ty + bb[3] - c_bottom
                    if crop_y1 > 0: char_temp.paste((0,0,0,0), (0, 0, tw, crop_y1))
                    if crop_y2 < th: char_temp.paste((0,0,0,0), (0, crop_y2, tw, th))
                    if crop_x1 > 0: char_temp.paste((0,0,0,0), (0, 0, crop_x1, th))
                    if crop_x2 < tw: char_temp.paste((0,0,0,0), (crop_x2, 0, tw, th))
                
                char_img = char_temp.crop((tx + bb[0], ty + bb[1], tx + bb[2], ty + bb[3]))
                
                # Apply Ligature Studio surgical tools by projecting back from studio coordinates
                studio_font = ImageFont.truetype(font_path, int(100 * scale))
                studio_bb = studio_font.getbbox(display_text)
                cw_studio = studio_bb[2] - studio_bb[0]
                ch_studio = studio_bb[3] - studio_bb[1]
                
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
                    except Exception as e:
                        print(f"Mask error: {e}")

                c_adjs = override.get("adjustments")
                if c_adjs:
                    try:
                        for adj in c_adjs:
                            lx = adj['x'] - bbox_x
                            ly = adj['y'] - bbox_y
                            low = adj['ow']
                            loh = adj['oh']
                            ldx = adj['dx']
                            ldy = adj['dy']
                            
                            part = char_img.crop((lx, ly, lx + low, ly + loh))
                            if adj.get('mode') == 'move':
                                char_img.paste((0,0,0,0), (int(lx), int(ly), int(lx+low), int(ly+loh)))
                            if adj.get('mode') == 'extend' and adj.get('fw') and adj.get('fh'):
                                part = part.resize((int(abs(adj['fw'])), int(abs(adj['fh']))), Image.Resampling.LANCZOS)
                            char_img.paste(part, (int(lx+ldx), int(ly+ldy)), part)
                    except Exception as e:
                        print(f"Adj error: {e}")

                xb = (total_width - char_img.width) // 2
                lig_layer.paste(char_img, (xb + x_off, lig_y_cursor + y_off), char_img)
                
                y_adv = override.get("y_advance")
                if y_adv is not None:
                    lig_y_cursor += int(y_adv * scale_factor)
                    studio_y_cursor += int(y_adv)
                else:
                    lig_y_cursor += line_height + req.line_spacing
                    studio_y_cursor += ch_studio + 20

            # Crop the finished ligature layer to content
            l_bbox = lig_layer.getbbox()
            if l_bbox:
                lig_final = lig_layer.crop(l_bbox)
                
                # Global adjustments and masks are no longer supported
                # as they have been migrated to per-character properties.
                
                x_base = (total_width - lig_final.width) // 2
                
                if first_item:
                    paste_y = y_cursor
                    first_item = False
                else:
                    paste_y = current_visible_bottom + req.line_spacing - l_bbox[1]
                
                img.paste(lig_final, (req.padding + x_base, paste_y), lig_final)
                
                current_visible_bottom = paste_y + l_bbox[3]
            else:
                if not first_item:
                    current_visible_bottom += line_height + req.line_spacing
            
            # Since we've handled the whole ligature, we continue to the next merged_line
            continue

        else:
            base_char = line.replace('\u094D', '')
            char_conf = configs.get(base_char, {})
            
            # Position-based variant selection
            if i == 0:
                # Top character: try 'first' then 'full'
                priority = ["first", "full"]
            elif i == len(merged_lines) - 1:
                # Bottom character: try 'last' then 'full'
                priority = ["last", "full"]
            else:
                # Middle characters: try 'middle' then 'full'
                priority = ["middle", "full"]
            
            override = None
            for p in priority:
                if p in char_conf:
                    override = char_conf[p]
                    break
            
            if not override:
                override = {} # Fallback to empty (default)
            display_text = line
            
            # (Standard rendering logic continues...)
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
            w, h = bb[2]-bb[0], bb[3]-bb[1]
            tw, th = w + 100, h + 100
            temp_layer = Image.new("RGBA", (tw, th), color=(0,0,0,0))
            temp_draw = ImageDraw.Draw(temp_layer)
            tx, ty = (tw - w) // 2 - bb[0], (th - h) // 2 - bb[1]
            temp_draw.text((tx, ty), display_text, font=current_font, fill=fg)
            
            if rot != 0 or sx != 0 or sy != 0:
                if rot != 0:
                    temp_layer = temp_layer.rotate(rot, resample=Image.BICUBIC, expand=False)
                if sx != 0 or sy != 0:
                    tw_layer, th_layer = temp_layer.size
                    temp_layer = temp_layer.transform((tw_layer, th_layer), Image.AFFINE, 
                                                     (1, -sx, sx * (th_layer/2), -sy, 1, sy * (tw_layer/2)),
                                                     resample=Image.BICUBIC)
            
            if c_top > 0 or c_bottom > 0 or c_left > 0 or c_right > 0:
                tw_layer, th_layer = temp_layer.size
                crop_x1 = tx + bb[0] + c_left
                crop_y1 = ty + bb[1] + c_top
                crop_x2 = tx + bb[2] - c_right
                crop_y2 = ty + bb[3] - c_bottom
                if crop_y1 > 0: temp_layer.paste((0,0,0,0), (0, 0, tw_layer, crop_y1))
                if crop_y2 < th_layer: temp_layer.paste((0,0,0,0), (0, crop_y2, tw_layer, th_layer))
                if crop_x1 > 0: temp_layer.paste((0,0,0,0), (0, 0, crop_x1, th_layer))
                if crop_x2 < tw_layer: temp_layer.paste((0,0,0,0), (crop_x2, 0, tw_layer, th_layer))
            
            cluster_img = temp_layer.crop((tx + bb[0], ty + bb[1], tx + bb[2], ty + bb[3]))
            
            actual_bbox = cluster_img.getbbox()
            if actual_bbox:
                x_base = (total_width - (bb[2]-bb[0])) // 2
                
                if first_item:
                    paste_y = y_cursor + y_off
                    first_item = False
                else:
                    paste_y = current_visible_bottom + req.line_spacing - actual_bbox[1] + y_off
                
                img.paste(cluster_img, (req.padding + x_base + x_off, paste_y), cluster_img)
                
                if first_char_origin_x is None:
                    first_char_origin_x = (req.padding + x_base + x_off) - bb[0]
                    first_char_origin_y = paste_y - bb[1]
                    first_char_text = display_text
                last_char_origin_x = (req.padding + x_base + x_off) - bb[0]
                last_char_origin_y = paste_y - bb[1]
                last_char_text = display_text
                
                current_visible_bottom = paste_y + actual_bbox[3]
            else:
                if not first_item:
                    current_visible_bottom += line_height + req.line_spacing

    # --- Render Shared Matra ---
    if final_matras:
        stack_bbox = img.getbbox()
        if stack_bbox:
            s_top, s_bottom = stack_bbox[1], stack_bbox[3]
            s_left, s_right = stack_bbox[0], stack_bbox[2]
            s_h = s_bottom - s_top
            s_w = s_right - s_left

            # Extract matra glyph exact coordinates relative to first and last characters
            mfont = ImageFont.truetype(font_path, req.font_size)
            tw, th = 500, 500

            def _get_matra_bbox_and_glyph(base_char, matra_char, pos='right'):
                if not base_char or pos == 'below': base_char = '\u0915'
                
                if pos == 'left':
                    # The cleanest approach: render the matra STANDALONE.
                    # It shows: [ikar arch stroke] [gap=0] [dotted circle dots]
                    # The dotted circle is separated by a hard zero-alpha column gap.
                    # We crop at that gap to get a 100% pure ikar arch — no consonant fragments.
                    temp_s = Image.new('RGBA', (tw, th), (0,0,0,0))
                    ImageDraw.Draw(temp_s).text((100, 100), matra_char, font=mfont, fill=fg)
                    bb_s = temp_s.getbbox()
                    if bb_s:
                        s_pix = temp_s.load()
                        col_alpha = [sum(s_pix[x, y][3] for y in range(th)) for x in range(tw)]
                        # Find the peak column (ikar arch main stroke)
                        peak_x = max(range(bb_s[0], bb_s[2]), key=lambda x: col_alpha[x])
                        # Find first zero column AFTER the peak — this is the gap before dotted circle
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

                            

                            # 1. Erase left decorative dots

                            left_edges = []

                            for y in range(bb_s[1] + 20, bb_s[3]):

                                row = arr[y, bb_s[0]:bb_s[2], 3]

                                nonzero = np.where(row > 0)[0]

                                if len(nonzero) > 0:

                                    left_edges.append(bb_s[0] + nonzero[0])

                            if left_edges:

                                stem_left_x = Counter(left_edges).most_common(1)[0][0]

                                draw.rectangle([(0, bb_s[1] + 20), (int(stem_left_x) - 1, bb_s[3])], fill=(0,0,0,0))

                                

                            # 2. Erase right dotted circle completely

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

                                    

                            draw.rectangle([(dip_x, arch_bottom_y), (tw, th)], fill=(0,0,0,0))

                            

                            # Recalculate gap_x to be the absolute right edge of the arch

                            c_alpha = [sum(s_pix[x, y][3] for y in range(th)) for x in range(tw)]

                            end_x = bb_s[2]

                            for x in range(tw - 1, peak_x, -1):

                                if c_alpha[x] > 0:

                                    end_x = x

                                    break

                            gap_x = end_x + 1

                        

                        # Crop to pure ikar arch only
                        pure_ikar = Image.new('RGBA', (tw, th), (0,0,0,0))
                        pure_ikar.paste(temp_s.crop((0, 0, gap_x, th)), (0, 0))
                        return pure_ikar.getbbox(), pure_ikar

                # Right/above/below matras: diff base_char+matra vs base_char alone
                text_with = base_char + matra_char
                temp_with = Image.new('RGBA', (tw, th), (0,0,0,0))
                ImageDraw.Draw(temp_with).text((100, 100), text_with, font=mfont, fill=fg)
                temp_ref = Image.new('RGBA', (tw, th), (0,0,0,0))
                ImageDraw.Draw(temp_ref).text((100, 100), base_char, font=mfont, fill=fg)
                from PIL import ImageChops
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
                                # Place the ikar arch completely to the LEFT of the consonant stack,
                                # with a small visual gap — matching how long-ii appears on the right.
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
                                scaled = Image.new('RGBA', (matra_glyph.width, target_height), (0,0,0,0))
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
                            if first_char_origin_x is not None: first_char_origin_x += shift_x
                            if last_char_origin_x is not None: last_char_origin_x += shift_x

                        need_w = paste_x + scaled.width
                        if need_w > img.width:
                            ni = Image.new('RGBA', (need_w, img.height), bg)
                            ni.paste(img, (0,0)); img = ni
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
                            ni.paste(img, (0,0)); img = ni
                        img.paste(matra_glyph_l, (paste_x, paste_y), matra_glyph_l)
    
                elif shared_matra_pos == 'above':
                    matra_glyph_f = temp_with_first.crop(matra_bbox_first) if matra_bbox_first else None
                    if matra_glyph_f:
                        dx_f = matra_bbox_first[0] - 100
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
                            ni.paste(img, (0, shift)); img = ni
                            paste_y = 0
                            s_top += shift
                            s_bottom += shift
                            if first_char_origin_y is not None: first_char_origin_y += shift
                            if last_char_origin_y is not None: last_char_origin_y += shift    
                        img.paste(matra_glyph_f, (paste_x, paste_y), matra_glyph_f)

    # Crop the final image to content bounds vertically
    final_bbox = img.getbbox()
    if final_bbox:
        crop_top = max(0, final_bbox[1] - req.padding)
        crop_bottom = min(img.height, final_bbox[3] + req.padding)
        img = img.crop((0, crop_top, img.width, crop_bottom))

    # --- Return PNG stream ---
    buf = io.BytesIO()
    fmt = "PNG"  # PNG supports transparency
    img.save(buf, format=fmt)
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png",
                             headers={"Content-Disposition": 'inline; filename="ranjana_monogram.png"'})


def _hex_to_rgb(hex_color: str):
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", "8002"))
    uvicorn.run(app, host="0.0.0.0", port=port)
