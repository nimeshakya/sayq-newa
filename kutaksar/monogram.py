import io
import json
from pathlib import Path
from typing import Optional

import data_gen
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from PIL import Image, ImageChops, ImageDraw, ImageFont
from pydantic import BaseModel


BASE_DIR = Path(__file__).resolve().parent
FONT_PATH = BASE_DIR / "NithyaRanjanaDU-Regular.otf"
GLYPH_CONFIG_PATH = BASE_DIR / "glyph_configs.json"
LIGATURE_CONFIG_PATH = BASE_DIR / "ligature_configs.json"

app = FastAPI(title="Monogram API")
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


@app.get("/status")
async def status():
    return {
        "glyph_config_exists": GLYPH_CONFIG_PATH.exists(),
        "ligature_config_exists": LIGATURE_CONFIG_PATH.exists(),
        "font_exists": FONT_PATH.exists(),
    }


@app.post("/monogram")
async def render_monogram(req: MonogramRequest):
    font_path = str(FONT_PATH)
    text = req.text.strip()
    if not text:
        return {"error": "No text provided"}

    # Transliterate if the input looks Romanized.
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

    if req.vertical and "\n" not in text:
        lines = re.findall(CLUSTER_REGEX, text)
        if not lines:
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

    total_width = max(line_widths) if line_widths else req.font_size
    safety_top = int(req.font_size * 0.15)
    img_w = total_width + req.padding * 2
    img_h = total_rendered_height + req.padding * 2 + safety_top

    transparent = req.bg_color is None or req.bg_color.lower() == "transparent"
    bg = (0, 0, 0, 0) if transparent else (*_hex_to_rgb(req.bg_color), 255)
    img = Image.new("RGBA", (img_w, img_h), color=bg)
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
            lig_layer_h = (len(char_configs) * (req.font_size + req.line_spacing)) + 100
            lig_layer = Image.new("RGBA", (total_width + 100, lig_layer_h), (0, 0, 0, 0))
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
                    except Exception as exc:
                        print(f"Mask error: {exc}")

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
                                char_img.paste((0, 0, 0, 0), (int(lx), int(ly), int(lx + low), int(ly + loh)))
                            if adj.get('mode') == 'extend' and adj.get('fw') and adj.get('fh'):
                                part = part.resize((int(abs(adj['fw'])), int(abs(adj['fh']))), Image.Resampling.LANCZOS)
                            char_img.paste(part, (int(lx + ldx), int(ly + ldy)), part)
                    except Exception as exc:
                        print(f"Adj error: {exc}")

                xb = (total_width - char_img.width) // 2
                lig_layer.paste(char_img, (xb + x_off, lig_y_cursor + y_off), char_img)

                y_adv = override.get("y_advance")
                if y_adv is not None:
                    lig_y_cursor += int(y_adv * scale_factor)
                    studio_y_cursor += int(y_adv)
                else:
                    lig_y_cursor += line_height + req.line_spacing
                    studio_y_cursor += ch_studio + 20

            l_bbox = lig_layer.getbbox()
            if l_bbox:
                lig_final = lig_layer.crop(l_bbox)
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

            continue

        base_char = line.replace('\u094D', '')
        char_conf = configs.get(base_char, {})

        if i == 0:
            priority = ["first", "full"]
        elif i == len(merged_lines) - 1:
            priority = ["last", "full"]
        else:
            priority = ["middle", "full"]

        override = None
        for p in priority:
            if p in char_conf:
                override = char_conf[p]
                break

        if not override:
            override = {}

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

        actual_bbox = cluster_img.getbbox()
        if actual_bbox:
            x_base = (total_width - (bb[2] - bb[0])) // 2

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