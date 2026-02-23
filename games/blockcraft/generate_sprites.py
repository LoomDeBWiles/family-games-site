#!/usr/bin/env python3
"""
BlockCraft Pixel Art Sprite Generator
Generates all block (16x16), item (16x16), and player (16x32) sprites.
"""

from PIL import Image, ImageDraw
import random
import os

BLOCK_SIZE = 16
PLAYER_W = 16
PLAYER_H = 32

OUT = "Assets/_Project/Art/Sprites"

def ensure_dir(path):
    os.makedirs(path, exist_ok=True)

def save(img, folder, name):
    ensure_dir(folder)
    img.save(os.path.join(folder, f"{name}.png"))

def noise_fill(img, base_color, variance=15, seed=None):
    """Fill image with a noisy version of base_color."""
    if seed is not None:
        random.seed(seed)
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r = max(0, min(255, base_color[0] + random.randint(-variance, variance)))
            g = max(0, min(255, base_color[1] + random.randint(-variance, variance)))
            b = max(0, min(255, base_color[2] + random.randint(-variance, variance)))
            px[x, y] = (r, g, b, 255)

def draw_border(img, color, width=1):
    """Draw a subtle border around the tile."""
    px = img.load()
    w, h = img.size
    darker = tuple(max(0, c - 30) for c in color) + (255,)
    for i in range(width):
        for x in range(w):
            px[x, i] = darker
            px[x, h - 1 - i] = darker
        for y in range(h):
            px[i, y] = darker
            px[w - 1 - i, y] = darker

# ============================================================
#  BLOCK SPRITES (16x16)
# ============================================================

def make_dirt():
    img = Image.new("RGBA", (BLOCK_SIZE, BLOCK_SIZE))
    noise_fill(img, (139, 90, 43), variance=12, seed=1)
    # Add some darker spots for texture
    px = img.load()
    random.seed(10)
    for _ in range(8):
        x, y = random.randint(1, 14), random.randint(1, 14)
        px[x, y] = (110, 70, 35, 255)
    draw_border(img, (139, 90, 43))
    return img

def make_grass():
    img = Image.new("RGBA", (BLOCK_SIZE, BLOCK_SIZE))
    # Dirt base
    noise_fill(img, (139, 90, 43), variance=10, seed=2)
    px = img.load()
    # Green grass top (top 4 rows)
    random.seed(20)
    for y in range(4):
        for x in range(BLOCK_SIZE):
            g = 140 + random.randint(-15, 15)
            r = 60 + random.randint(-10, 10)
            b = 30 + random.randint(-10, 10)
            px[x, y] = (r, g, b, 255)
    # Grass blades on row 0
    for x in range(0, 16, 2):
        px[x, 0] = (40, 160 + random.randint(-10, 10), 20, 255)
    # Transition row
    for x in range(BLOCK_SIZE):
        if random.random() > 0.5:
            px[x, 4] = (100, 110, 40, 255)
    draw_border(img, (60, 130, 30))
    return img

def make_stone():
    img = Image.new("RGBA", (BLOCK_SIZE, BLOCK_SIZE))
    noise_fill(img, (128, 128, 128), variance=12, seed=3)
    px = img.load()
    # Add cracks / darker lines
    random.seed(30)
    # Horizontal crack
    y = random.randint(5, 10)
    for x in range(3, 13):
        px[x, y] = (90, 90, 90, 255)
    # Diagonal crack
    sx = random.randint(2, 6)
    for i in range(5):
        px[sx + i, 3 + i] = (95, 95, 95, 255)
    draw_border(img, (128, 128, 128))
    return img

def make_wood():
    img = Image.new("RGBA", (BLOCK_SIZE, BLOCK_SIZE))
    px = img.load()
    random.seed(4)
    for y in range(BLOCK_SIZE):
        for x in range(BLOCK_SIZE):
            # Vertical wood grain
            base_r, base_g, base_b = 101, 67, 33
            grain = ((x + y // 3) % 4)
            r = base_r + grain * 8 + random.randint(-5, 5)
            g = base_g + grain * 5 + random.randint(-5, 5)
            b = base_b + grain * 2 + random.randint(-3, 3)
            px[x, y] = (max(0, min(255, r)), max(0, min(255, g)), max(0, min(255, b)), 255)
    # Ring patterns
    for cy in [5, 11]:
        for cx in [5, 11]:
            for dx in range(-2, 3):
                for dy in range(-2, 3):
                    if abs(dx) + abs(dy) == 2:
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < 16 and 0 <= ny < 16:
                            px[nx, ny] = (80, 55, 28, 255)
    draw_border(img, (101, 67, 33))
    return img

def make_leaves():
    img = Image.new("RGBA", (BLOCK_SIZE, BLOCK_SIZE))
    px = img.load()
    random.seed(5)
    for y in range(BLOCK_SIZE):
        for x in range(BLOCK_SIZE):
            if random.random() > 0.15:
                g = 120 + random.randint(-20, 40)
                r = 30 + random.randint(-10, 20)
                b = 20 + random.randint(-10, 10)
                px[x, y] = (r, g, b, 200 + random.randint(0, 55))
            else:
                # Gaps in leaves (semi-transparent)
                px[x, y] = (20, 80, 15, 80)
    return img

def make_bedrock():
    img = Image.new("RGBA", (BLOCK_SIZE, BLOCK_SIZE))
    noise_fill(img, (50, 50, 50), variance=10, seed=6)
    px = img.load()
    random.seed(60)
    # Very dark with occasional lighter spots
    for _ in range(12):
        x, y = random.randint(0, 15), random.randint(0, 15)
        px[x, y] = (30, 30, 30, 255)
    for _ in range(6):
        x, y = random.randint(0, 15), random.randint(0, 15)
        px[x, y] = (70, 70, 70, 255)
    draw_border(img, (40, 40, 40))
    return img

def make_coal():
    img = Image.new("RGBA", (BLOCK_SIZE, BLOCK_SIZE))
    # Stone base
    noise_fill(img, (128, 128, 128), variance=10, seed=7)
    px = img.load()
    random.seed(70)
    # Coal spots (dark clusters)
    centers = [(4, 4), (10, 8), (7, 12), (13, 3)]
    for cx, cy in centers:
        for dx in range(-1, 2):
            for dy in range(-1, 2):
                nx, ny = cx + dx, cy + dy
                if 0 <= nx < 16 and 0 <= ny < 16:
                    if abs(dx) + abs(dy) <= 1:
                        px[nx, ny] = (30 + random.randint(-5, 5), 30 + random.randint(-5, 5), 30 + random.randint(-5, 5), 255)
    draw_border(img, (128, 128, 128))
    return img

def make_iron_ore():
    img = Image.new("RGBA", (BLOCK_SIZE, BLOCK_SIZE))
    noise_fill(img, (128, 128, 128), variance=10, seed=8)
    px = img.load()
    random.seed(80)
    # Iron spots (beige/tan)
    centers = [(5, 5), (11, 9), (3, 11), (12, 3)]
    for cx, cy in centers:
        for dx in range(-1, 2):
            for dy in range(-1, 2):
                nx, ny = cx + dx, cy + dy
                if 0 <= nx < 16 and 0 <= ny < 16:
                    if abs(dx) + abs(dy) <= 1:
                        px[nx, ny] = (200 + random.randint(-10, 10), 170 + random.randint(-10, 10), 140 + random.randint(-10, 10), 255)
    draw_border(img, (128, 128, 128))
    return img

def make_gold_ore():
    img = Image.new("RGBA", (BLOCK_SIZE, BLOCK_SIZE))
    noise_fill(img, (128, 128, 128), variance=10, seed=9)
    px = img.load()
    random.seed(90)
    # Gold spots (yellow)
    centers = [(4, 6), (10, 4), (7, 11), (13, 10)]
    for cx, cy in centers:
        for dx in range(-1, 2):
            for dy in range(-1, 2):
                nx, ny = cx + dx, cy + dy
                if 0 <= nx < 16 and 0 <= ny < 16:
                    if abs(dx) + abs(dy) <= 1:
                        px[nx, ny] = (255, 215 + random.randint(-15, 15), 0, 255)
    draw_border(img, (128, 128, 128))
    return img

def make_diamond_ore():
    img = Image.new("RGBA", (BLOCK_SIZE, BLOCK_SIZE))
    noise_fill(img, (128, 128, 128), variance=10, seed=10)
    px = img.load()
    random.seed(100)
    # Diamond spots (cyan/light blue)
    centers = [(5, 5), (11, 8), (4, 12), (13, 3)]
    for cx, cy in centers:
        for dx in range(-1, 2):
            for dy in range(-1, 2):
                nx, ny = cx + dx, cy + dy
                if 0 <= nx < 16 and 0 <= ny < 16:
                    if abs(dx) + abs(dy) <= 1:
                        px[nx, ny] = (100 + random.randint(-10, 10), 220 + random.randint(-15, 15), 255, 255)
                    elif random.random() > 0.5:
                        px[nx, ny] = (140, 200, 230, 255)
    draw_border(img, (128, 128, 128))
    return img

def make_sand():
    img = Image.new("RGBA", (BLOCK_SIZE, BLOCK_SIZE))
    noise_fill(img, (210, 190, 140), variance=12, seed=11)
    px = img.load()
    random.seed(110)
    # A few darker sand grains
    for _ in range(10):
        x, y = random.randint(0, 15), random.randint(0, 15)
        px[x, y] = (190, 170, 120, 255)
    draw_border(img, (200, 180, 130))
    return img

def make_cobblestone():
    img = Image.new("RGBA", (BLOCK_SIZE, BLOCK_SIZE))
    noise_fill(img, (120, 120, 120), variance=10, seed=12)
    px = img.load()
    random.seed(120)
    # Draw cobble pattern - darker mortar lines
    mortar = (85, 85, 85, 255)
    # Horizontal lines
    for x in range(16):
        px[x, 4] = mortar
        px[x, 8] = mortar
        px[x, 12] = mortar
    # Offset vertical lines
    for y in range(0, 4):
        px[5, y] = mortar
        px[11, y] = mortar
    for y in range(5, 8):
        px[3, y] = mortar
        px[8, y] = mortar
        px[14, y] = mortar
    for y in range(9, 12):
        px[5, y] = mortar
        px[11, y] = mortar
    for y in range(13, 16):
        px[3, y] = mortar
        px[8, y] = mortar
        px[14, y] = mortar
    draw_border(img, (100, 100, 100))
    return img

def make_planks():
    img = Image.new("RGBA", (BLOCK_SIZE, BLOCK_SIZE))
    px = img.load()
    random.seed(13)
    plank_color = (180, 130, 70)
    for y in range(BLOCK_SIZE):
        for x in range(BLOCK_SIZE):
            r = plank_color[0] + random.randint(-8, 8)
            g = plank_color[1] + random.randint(-8, 8)
            b = plank_color[2] + random.randint(-5, 5)
            px[x, y] = (max(0, min(255, r)), max(0, min(255, g)), max(0, min(255, b)), 255)
    # Horizontal plank lines (dividers)
    dark_line = (140, 95, 50, 255)
    for x in range(16):
        px[x, 0] = dark_line
        px[x, 4] = dark_line
        px[x, 8] = dark_line
        px[x, 12] = dark_line
    # Nail dots
    px[2, 2] = (100, 80, 60, 255)
    px[13, 2] = (100, 80, 60, 255)
    px[2, 6] = (100, 80, 60, 255)
    px[13, 6] = (100, 80, 60, 255)
    px[2, 10] = (100, 80, 60, 255)
    px[13, 10] = (100, 80, 60, 255)
    px[2, 14] = (100, 80, 60, 255)
    px[13, 14] = (100, 80, 60, 255)
    draw_border(img, (160, 110, 55))
    return img

def make_workbench():
    img = Image.new("RGBA", (BLOCK_SIZE, BLOCK_SIZE))
    px = img.load()
    random.seed(14)
    # Planks base
    plank = (180, 130, 70)
    for y in range(BLOCK_SIZE):
        for x in range(BLOCK_SIZE):
            px[x, y] = (plank[0] + random.randint(-8, 8),
                         plank[1] + random.randint(-8, 8),
                         plank[2] + random.randint(-5, 5), 255)
    # Top surface (darker, polished)
    for y in range(0, 4):
        for x in range(BLOCK_SIZE):
            px[x, y] = (150 + random.randint(-5, 5), 100 + random.randint(-5, 5), 50 + random.randint(-3, 3), 255)
    # Grid lines on top
    for x in range(16):
        px[x, 0] = (120, 80, 40, 255)
        px[x, 3] = (120, 80, 40, 255)
    for y in range(4):
        px[0, y] = (120, 80, 40, 255)
        px[5, y] = (120, 80, 40, 255)
        px[10, y] = (120, 80, 40, 255)
        px[15, y] = (120, 80, 40, 255)
    # Saw/tool icon on front face
    # Small hammer shape
    for x in range(6, 10):
        px[x, 7] = (100, 100, 100, 255)  # hammer head
    px[8, 8] = (80, 60, 30, 255)  # handle
    px[8, 9] = (80, 60, 30, 255)
    px[8, 10] = (80, 60, 30, 255)
    draw_border(img, (140, 95, 50))
    return img

def make_furnace():
    img = Image.new("RGBA", (BLOCK_SIZE, BLOCK_SIZE))
    px = img.load()
    random.seed(15)
    # Stone base
    stone = (130, 130, 130)
    for y in range(BLOCK_SIZE):
        for x in range(BLOCK_SIZE):
            px[x, y] = (stone[0] + random.randint(-8, 8),
                         stone[1] + random.randint(-8, 8),
                         stone[2] + random.randint(-8, 8), 255)
    # Opening (fire hole) - dark center
    for y in range(7, 14):
        for x in range(5, 11):
            px[x, y] = (40, 20, 20, 255)
    # Fire inside
    fire_colors = [(255, 100, 0), (255, 160, 0), (255, 200, 50), (255, 80, 0)]
    for y in range(9, 14):
        for x in range(6, 10):
            c = random.choice(fire_colors)
            px[x, y] = (c[0], c[1], c[2], 255)
    # Grate at top of opening
    for x in range(5, 11):
        px[x, 7] = (80, 80, 80, 255)
    # Top vent
    for x in range(6, 10):
        px[x, 1] = (60, 60, 60, 255)
        px[x, 2] = (80, 80, 80, 255)
    draw_border(img, (110, 110, 110))
    return img

def make_torch():
    img = Image.new("RGBA", (BLOCK_SIZE, BLOCK_SIZE), (0, 0, 0, 0))
    px = img.load()
    # Stick
    stick_color = (140, 100, 50, 255)
    for y in range(6, 14):
        px[7, y] = stick_color
        px[8, y] = stick_color
    # Base
    px[7, 14] = (120, 80, 40, 255)
    px[8, 14] = (120, 80, 40, 255)
    # Flame
    flame_core = (255, 220, 50, 255)
    flame_mid = (255, 160, 0, 255)
    flame_outer = (255, 100, 0, 200)
    flame_tip = (255, 240, 100, 180)
    # Core
    px[7, 5] = flame_core
    px[8, 5] = flame_core
    px[7, 4] = flame_mid
    px[8, 4] = flame_mid
    # Mid
    px[6, 5] = flame_mid
    px[9, 5] = flame_mid
    px[7, 3] = flame_outer
    px[8, 3] = flame_outer
    # Tip
    px[7, 2] = flame_tip
    px[8, 2] = (255, 200, 80, 140)
    # Glow (subtle)
    px[6, 4] = (255, 120, 0, 120)
    px[9, 4] = (255, 120, 0, 120)
    px[7, 1] = (255, 200, 50, 80)
    return img


# ============================================================
#  PLAYER SPRITES (16x32)
# ============================================================

def make_player_base(px, w=16, h=32):
    """Draw the base player body."""
    # Skin color
    skin = (230, 180, 140, 255)
    skin_dark = (200, 155, 120, 255)

    # Hair (dark brown)
    hair = (60, 35, 20, 255)

    # Shirt (blue)
    shirt = (50, 100, 200, 255)
    shirt_dark = (40, 80, 170, 255)

    # Pants (brown)
    pants = (90, 65, 45, 255)
    pants_dark = (70, 50, 35, 255)

    # Shoes (dark)
    shoes = (50, 40, 30, 255)

    # Eyes
    eye = (40, 40, 40, 255)
    eye_white = (255, 255, 255, 255)

    # === HEAD (rows 0-9) ===
    # Hair top
    for x in range(5, 11):
        px[x, 0] = hair
        px[x, 1] = hair
    for x in range(4, 12):
        px[x, 2] = hair

    # Face
    for y in range(3, 8):
        for x in range(5, 11):
            px[x, y] = skin
    # Side of face
    for y in range(3, 7):
        px[4, y] = skin
        px[11, y] = skin

    # Hair sides
    px[4, 2] = hair
    px[4, 3] = hair
    px[11, 2] = hair
    px[11, 3] = hair

    # Eyes (row 4-5)
    px[6, 4] = eye_white
    px[7, 4] = eye
    px[9, 4] = eye_white
    px[10, 4] = eye

    # Mouth
    px[7, 6] = skin_dark
    px[8, 6] = skin_dark

    # Chin
    for x in range(6, 10):
        px[x, 8] = skin
    for x in range(7, 9):
        px[x, 9] = skin

    # === BODY / SHIRT (rows 10-19) ===
    for y in range(10, 20):
        for x in range(5, 11):
            px[x, y] = shirt
    # Shirt shading (left side darker)
    for y in range(10, 20):
        px[5, y] = shirt_dark
        px[10, y] = shirt_dark

    # Arms
    for y in range(10, 18):
        px[3, y] = shirt
        px[4, y] = shirt
        px[11, y] = shirt
        px[12, y] = shirt
    # Hands
    for y in range(18, 20):
        px[3, y] = skin
        px[4, y] = skin
        px[11, y] = skin
        px[12, y] = skin

    # Collar detail
    px[7, 10] = shirt_dark
    px[8, 10] = shirt_dark

    # Belt
    for x in range(5, 11):
        px[x, 19] = (70, 50, 30, 255)
    px[7, 19] = (200, 180, 50, 255)  # Belt buckle
    px[8, 19] = (200, 180, 50, 255)

    # === LEGS / PANTS (rows 20-27) ===
    for y in range(20, 28):
        for x in range(5, 8):
            px[x, y] = pants
        for x in range(8, 11):
            px[x, y] = pants
    # Pants shading
    for y in range(20, 28):
        px[5, y] = pants_dark
        px[10, y] = pants_dark
    # Gap between legs
    px[7, 25] = pants_dark
    px[8, 25] = pants_dark
    px[7, 26] = pants_dark
    px[8, 26] = pants_dark
    px[7, 27] = pants_dark
    px[8, 27] = pants_dark

    # === SHOES (rows 28-31) ===
    for y in range(28, 31):
        for x in range(4, 8):
            px[x, y] = shoes
        for x in range(8, 12):
            px[x, y] = shoes
    # Shoe soles
    for x in range(4, 8):
        px[x, 31] = (35, 28, 20, 255)
    for x in range(8, 12):
        px[x, 31] = (35, 28, 20, 255)

def make_player_idle():
    img = Image.new("RGBA", (PLAYER_W, PLAYER_H), (0, 0, 0, 0))
    px = img.load()
    make_player_base(px)
    return img

def make_player_walk1():
    """Walk frame 1 - left leg forward."""
    img = Image.new("RGBA", (PLAYER_W, PLAYER_H), (0, 0, 0, 0))
    px = img.load()
    make_player_base(px)

    pants = (90, 65, 45, 255)
    pants_dark = (70, 50, 35, 255)
    shoes = (50, 40, 30, 255)

    # Clear default legs
    for y in range(24, 32):
        for x in range(4, 12):
            px[x, y] = (0, 0, 0, 0)

    # Left leg forward
    for y in range(24, 28):
        px[4, y] = pants
        px[5, y] = pants
        px[6, y] = pants
    for y in range(28, 31):
        px[3, y] = shoes
        px[4, y] = shoes
        px[5, y] = shoes
    px[3, 31] = (35, 28, 20, 255)
    px[4, 31] = (35, 28, 20, 255)
    px[5, 31] = (35, 28, 20, 255)

    # Right leg back
    for y in range(24, 28):
        px[9, y] = pants_dark
        px[10, y] = pants_dark
        px[11, y] = pants_dark
    for y in range(28, 31):
        px[10, y] = shoes
        px[11, y] = shoes
        px[12, y] = shoes
    px[10, 31] = (35, 28, 20, 255)
    px[11, 31] = (35, 28, 20, 255)
    px[12, 31] = (35, 28, 20, 255)

    # Arm swing - left arm forward
    skin = (230, 180, 140, 255)
    shirt = (50, 100, 200, 255)
    for y in range(10, 16):
        px[2, y] = shirt
        px[3, y] = shirt
    px[2, 16] = skin
    px[3, 16] = skin

    # Right arm back
    for y in range(12, 18):
        px[12, y] = shirt
        px[13, y] = shirt
    px[12, 18] = skin
    px[13, 18] = skin

    return img

def make_player_walk2():
    """Walk frame 2 - right leg forward."""
    img = Image.new("RGBA", (PLAYER_W, PLAYER_H), (0, 0, 0, 0))
    px = img.load()
    make_player_base(px)

    pants = (90, 65, 45, 255)
    pants_dark = (70, 50, 35, 255)
    shoes = (50, 40, 30, 255)

    # Clear default legs
    for y in range(24, 32):
        for x in range(4, 12):
            px[x, y] = (0, 0, 0, 0)

    # Right leg forward
    for y in range(24, 28):
        px[9, y] = pants
        px[10, y] = pants
        px[11, y] = pants
    for y in range(28, 31):
        px[10, y] = shoes
        px[11, y] = shoes
        px[12, y] = shoes
    px[10, 31] = (35, 28, 20, 255)
    px[11, 31] = (35, 28, 20, 255)
    px[12, 31] = (35, 28, 20, 255)

    # Left leg back
    for y in range(24, 28):
        px[4, y] = pants_dark
        px[5, y] = pants_dark
        px[6, y] = pants_dark
    for y in range(28, 31):
        px[3, y] = shoes
        px[4, y] = shoes
        px[5, y] = shoes
    px[3, 31] = (35, 28, 20, 255)
    px[4, 31] = (35, 28, 20, 255)
    px[5, 31] = (35, 28, 20, 255)

    # Arm swing reversed
    skin = (230, 180, 140, 255)
    shirt = (50, 100, 200, 255)
    for y in range(12, 18):
        px[2, y] = shirt
        px[3, y] = shirt
    px[2, 18] = skin
    px[3, 18] = skin

    for y in range(10, 16):
        px[12, y] = shirt
        px[13, y] = shirt
    px[12, 16] = skin
    px[13, 16] = skin

    return img

def make_player_jump():
    """Jump frame - arms up, legs tucked."""
    img = Image.new("RGBA", (PLAYER_W, PLAYER_H), (0, 0, 0, 0))
    px = img.load()
    make_player_base(px)

    skin = (230, 180, 140, 255)
    shirt = (50, 100, 200, 255)
    pants = (90, 65, 45, 255)
    shoes = (50, 40, 30, 255)

    # Arms up
    for y in range(6, 12):
        px[2, y] = shirt
        px[3, y] = shirt
        px[12, y] = shirt
        px[13, y] = shirt
    # Clear old arm positions
    for y in range(12, 20):
        px[3, y] = (0, 0, 0, 0)
        px[4, y] = (0, 0, 0, 0) if y >= 14 else px[4, y]
        px[11, y] = (0, 0, 0, 0) if y >= 14 else px[11, y]
        px[12, y] = (0, 0, 0, 0)
    # Hands up
    px[2, 5] = skin
    px[3, 5] = skin
    px[12, 5] = skin
    px[13, 5] = skin

    # Tuck legs slightly (shift up 1)
    for y in range(27, 32):
        for x in range(4, 12):
            px[x, y] = (0, 0, 0, 0)
    # Re-draw shoes higher
    for y in range(27, 30):
        for x in range(4, 8):
            px[x, y] = shoes
        for x in range(8, 12):
            px[x, y] = shoes

    return img

def make_player_mine():
    """Mining frame - arm extended forward."""
    img = Image.new("RGBA", (PLAYER_W, PLAYER_H), (0, 0, 0, 0))
    px = img.load()
    make_player_base(px)

    skin = (230, 180, 140, 255)
    shirt = (50, 100, 200, 255)
    tool = (140, 140, 140, 255)

    # Right arm extended forward and up
    for y in range(8, 12):
        px[12, y] = shirt
        px[13, y] = shirt
        px[14, y] = shirt
    px[14, 7] = skin
    px[15, 7] = skin

    # Pickaxe in hand
    px[15, 5] = tool
    px[15, 6] = tool
    px[14, 6] = tool
    px[13, 6] = (100, 70, 40, 255)  # handle
    px[13, 7] = (100, 70, 40, 255)

    return img


# ============================================================
#  ENEMY SPRITES
# ============================================================

def make_zombie():
    """16x32 zombie sprite - green-skinned humanoid."""
    img = Image.new("RGBA", (16, 32), (0, 0, 0, 0))
    px = img.load()

    skin = (100, 160, 80, 255)
    skin_dark = (80, 130, 60, 255)
    shirt = (80, 70, 60, 255)
    shirt_dark = (60, 50, 40, 255)
    pants = (50, 50, 80, 255)
    eye = (200, 0, 0, 255)
    hair = (40, 30, 20, 255)
    shoes = (40, 35, 30, 255)

    # Head
    for x in range(5, 11):
        px[x, 0] = hair
        px[x, 1] = hair
    for y in range(2, 8):
        for x in range(5, 11):
            px[x, y] = skin
    for y in range(2, 7):
        px[4, y] = skin
        px[11, y] = skin
    # Eyes (red, menacing)
    px[6, 4] = eye
    px[7, 4] = eye
    px[9, 4] = eye
    px[10, 4] = eye
    # Mouth
    px[7, 6] = skin_dark
    px[8, 6] = (60, 20, 20, 255)  # Bloody mouth
    px[9, 6] = skin_dark
    # Chin
    for x in range(6, 10):
        px[x, 8] = skin
    for x in range(7, 9):
        px[x, 9] = skin

    # Tattered shirt
    for y in range(10, 20):
        for x in range(5, 11):
            px[x, y] = shirt if random.random() > 0.15 else shirt_dark
    # Arms extended forward (zombie pose!)
    for y in range(10, 14):
        px[3, y] = shirt
        px[4, y] = shirt
        px[11, y] = shirt
        px[12, y] = shirt
    for y in range(10, 12):
        px[1, y] = skin
        px[2, y] = skin
        px[13, y] = skin
        px[14, y] = skin

    # Pants
    for y in range(20, 28):
        for x in range(5, 8):
            px[x, y] = pants
        for x in range(8, 11):
            px[x, y] = pants

    # Shoes
    for y in range(28, 31):
        for x in range(4, 8):
            px[x, y] = shoes
        for x in range(8, 12):
            px[x, y] = shoes
    for x in range(4, 12):
        px[x, 31] = (30, 25, 20, 255)

    return img

def make_slime():
    """16x16 slime sprite - bouncy blob."""
    img = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    px = img.load()

    # Body (green translucent blob)
    body = (50, 200, 50, 200)
    body_light = (80, 230, 80, 180)
    body_dark = (30, 150, 30, 220)
    eye = (255, 255, 255, 255)
    pupil = (20, 20, 20, 255)

    # Blob shape
    #     ####
    #   ########
    #  ##########
    #  ##########
    #  ##########
    #   ########
    rows = [
        (5, 11),   # y=3
        (4, 12),   # y=4
        (3, 13),   # y=5
        (3, 13),   # y=6
        (3, 13),   # y=7
        (3, 13),   # y=8
        (3, 13),   # y=9
        (3, 13),   # y=10
        (4, 12),   # y=11
        (4, 12),   # y=12
        (5, 11),   # y=13
        (6, 10),   # y=14
    ]

    for i, (start, end) in enumerate(rows):
        y = 3 + i
        for x in range(start, end):
            px[x, y] = body

    # Shading - lighter top, darker bottom
    for x in range(5, 11):
        px[x, 3] = body_light
        px[x, 4] = body_light
    for x in range(4, 12):
        px[x, 12] = body_dark
        px[x, 13] = body_dark
    for x in range(5, 11):
        px[x, 14] = body_dark

    # Highlight
    px[5, 5] = (120, 255, 120, 160)
    px[6, 5] = (120, 255, 120, 140)
    px[5, 6] = (100, 240, 100, 140)

    # Eyes
    px[5, 7] = eye
    px[6, 7] = eye
    px[6, 8] = pupil
    px[9, 7] = eye
    px[10, 7] = eye
    px[10, 8] = pupil

    # Mouth
    px[7, 10] = body_dark
    px[8, 10] = body_dark

    return img

def make_skeleton():
    """16x32 skeleton sprite."""
    img = Image.new("RGBA", (16, 32), (0, 0, 0, 0))
    px = img.load()

    bone = (220, 215, 200, 255)
    bone_dark = (180, 175, 160, 255)
    eye = (200, 0, 0, 255)

    # Skull
    for y in range(1, 8):
        for x in range(5, 11):
            px[x, y] = bone
    for y in range(2, 7):
        px[4, y] = bone
        px[11, y] = bone
    px[5, 0] = bone
    px[6, 0] = bone
    px[9, 0] = bone
    px[10, 0] = bone

    # Eye sockets (dark)
    px[6, 3] = (30, 30, 30, 255)
    px[7, 3] = (30, 30, 30, 255)
    px[6, 4] = (30, 30, 30, 255)
    px[7, 4] = eye  # Red glow
    px[9, 3] = (30, 30, 30, 255)
    px[10, 3] = (30, 30, 30, 255)
    px[9, 4] = eye  # Red glow
    px[10, 4] = (30, 30, 30, 255)

    # Nose hole
    px[8, 5] = (40, 40, 40, 255)

    # Teeth/jaw
    for x in range(6, 11):
        px[x, 7] = bone_dark
    px[6, 7] = (40, 40, 40, 255)
    px[8, 7] = (40, 40, 40, 255)
    px[10, 7] = (40, 40, 40, 255)

    # Spine/neck
    for y in range(8, 10):
        px[7, y] = bone
        px[8, y] = bone

    # Ribcage
    for y in range(10, 18):
        px[7, y] = bone_dark  # Spine
        px[8, y] = bone_dark
    # Ribs
    for ry in [11, 13, 15]:
        for x in range(5, 12):
            if x != 7 and x != 8:
                px[x, ry] = bone

    # Arms (bony)
    for y in range(10, 20):
        px[3, y] = bone
        px[4, y] = bone_dark
        px[11, y] = bone_dark
        px[12, y] = bone
    # Hands
    px[3, 20] = bone
    px[4, 20] = bone
    px[11, 20] = bone
    px[12, 20] = bone

    # Pelvis
    for x in range(5, 11):
        px[x, 19] = bone

    # Legs (bony)
    for y in range(20, 28):
        px[5, y] = bone
        px[6, y] = bone_dark
        px[9, y] = bone_dark
        px[10, y] = bone

    # Feet
    for y in range(28, 31):
        for x in range(4, 7):
            px[x, y] = bone_dark
        for x in range(9, 12):
            px[x, y] = bone_dark

    return img


# ============================================================
#  ITEM SPRITES (16x16)
# ============================================================

def make_item_pickaxe(color, name_suffix):
    """Generic pickaxe icon."""
    img = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    px = img.load()
    handle = (120, 80, 40, 255)

    # Handle (diagonal)
    for i in range(8):
        px[4 + i, 12 - i] = handle
        if i < 7:
            px[5 + i, 12 - i] = handle

    # Head
    for x in range(2, 8):
        px[x, 3] = color
        px[x, 4] = color
    # Pick point right
    px[8, 3] = color
    px[9, 2] = color
    # Pick point left
    px[1, 4] = color
    px[0, 5] = color

    return img

def make_item_sword(color, name_suffix):
    """Generic sword icon."""
    img = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    px = img.load()
    handle = (120, 80, 40, 255)
    guard = (180, 160, 50, 255)

    # Blade (diagonal)
    for i in range(8):
        px[3 + i, 12 - i] = color
        if i < 7:
            px[4 + i, 12 - i] = color

    # Tip
    px[11, 4] = color
    px[12, 3] = color

    # Guard (cross)
    for x in range(2, 7):
        px[x, 10] = guard

    # Handle
    px[2, 11] = handle
    px[1, 12] = handle
    px[2, 12] = handle
    px[1, 13] = handle
    # Pommel
    px[0, 14] = (160, 140, 40, 255)
    px[1, 14] = (160, 140, 40, 255)

    return img

def make_item_axe(color):
    """Generic axe icon."""
    img = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    px = img.load()
    handle = (120, 80, 40, 255)

    # Handle
    for i in range(9):
        px[4 + i, 12 - i] = handle

    # Axe head
    for y in range(2, 7):
        for x in range(1, 5):
            px[x, y] = color
    # Blade edge
    px[0, 3] = color
    px[0, 4] = color
    px[0, 5] = color

    return img

def make_item_bow():
    """Bow icon."""
    img = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    px = img.load()
    wood = (140, 100, 50, 255)
    string = (200, 200, 200, 255)

    # Bow curve
    px[4, 1] = wood
    px[3, 2] = wood
    px[3, 3] = wood
    px[2, 4] = wood
    px[2, 5] = wood
    px[2, 6] = wood
    px[2, 7] = wood
    px[2, 8] = wood
    px[2, 9] = wood
    px[2, 10] = wood
    px[2, 11] = wood
    px[3, 12] = wood
    px[3, 13] = wood
    px[4, 14] = wood

    # String
    for y in range(1, 15):
        px[5, y] = string

    # Arrow
    arrow = (160, 130, 80, 255)
    for x in range(6, 14):
        px[x, 7] = arrow
    px[14, 7] = (180, 180, 180, 255)  # Arrowhead
    px[15, 6] = (180, 180, 180, 255)
    px[15, 8] = (180, 180, 180, 255)
    # Fletching
    px[6, 6] = (200, 50, 50, 255)
    px[6, 8] = (200, 50, 50, 255)

    return img

def make_item_generic(base_color, icon_type="square"):
    """Generic item icon (for materials)."""
    img = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    px = img.load()

    if icon_type == "ingot":
        # Ingot shape
        for y in range(5, 12):
            for x in range(3, 13):
                px[x, y] = base_color
        for x in range(4, 12):
            px[x, 4] = base_color
        for x in range(5, 11):
            px[x, 3] = base_color
        # Shine
        px[5, 5] = tuple(min(255, c + 40) for c in base_color[:3]) + (255,)
        px[6, 5] = tuple(min(255, c + 40) for c in base_color[:3]) + (255,)
        # Shadow
        for x in range(3, 13):
            px[x, 11] = tuple(max(0, c - 30) for c in base_color[:3]) + (255,)

    elif icon_type == "gem":
        # Diamond shape
        points = [
            (7, 2), (8, 2),
            (6, 3), (7, 3), (8, 3), (9, 3),
            (5, 4), (6, 4), (7, 4), (8, 4), (9, 4), (10, 4),
            (4, 5), (5, 5), (6, 5), (7, 5), (8, 5), (9, 5), (10, 5), (11, 5),
        ]
        for x, y in points:
            px[x, y] = base_color
        # Lower half
        for dy in range(7):
            w = 8 - dy
            sx = 8 - w
            for x in range(sx, sx + w * 2):
                if 0 <= x < 16:
                    px[x, 6 + dy] = base_color
        # Shine
        px[7, 4] = tuple(min(255, c + 50) for c in base_color[:3]) + (255,)
        px[8, 4] = tuple(min(255, c + 50) for c in base_color[:3]) + (255,)

    elif icon_type == "lump":
        # Irregular lump (coal, etc.)
        for y in range(5, 12):
            for x in range(4, 12):
                if random.random() > 0.1:
                    px[x, y] = base_color
        for x in range(5, 11):
            px[x, 4] = base_color
            px[x, 12] = base_color

    else:  # square block item
        for y in range(3, 13):
            for x in range(3, 13):
                px[x, y] = base_color
        # 3D effect
        for y in range(3, 13):
            px[3, y] = tuple(max(0, c - 20) for c in base_color[:3]) + (255,)
        for x in range(3, 13):
            px[x, 12] = tuple(max(0, c - 20) for c in base_color[:3]) + (255,)

    return img

def make_food_apple():
    """Apple food item."""
    img = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    px = img.load()

    red = (200, 30, 30, 255)
    red_dark = (160, 20, 20, 255)
    red_light = (230, 60, 60, 255)
    stem = (100, 70, 30, 255)
    leaf = (40, 140, 30, 255)

    # Stem
    px[7, 2] = stem
    px[7, 3] = stem
    px[8, 2] = stem

    # Leaf
    px[9, 2] = leaf
    px[10, 3] = leaf
    px[9, 3] = leaf

    # Apple body
    rows = [
        (6, 10, 4),
        (5, 11, 5),
        (4, 12, 6),
        (4, 12, 7),
        (4, 12, 8),
        (4, 12, 9),
        (4, 12, 10),
        (5, 11, 11),
        (5, 11, 12),
        (6, 10, 13),
    ]
    for sx, ex, y in rows:
        for x in range(sx, ex):
            px[x, y] = red

    # Shading
    for y in range(5, 13):
        px[4, y] = red_dark if y >= 4 and y <= 13 and px[4, y][3] > 0 else px[4, y]
        px[11, y] = red_dark if px[11, y][3] > 0 else px[11, y]

    # Highlight
    px[6, 5] = red_light
    px[7, 5] = red_light
    px[6, 6] = red_light

    return img

def make_food_meat():
    """Cooked meat item."""
    img = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    px = img.load()

    meat = (180, 80, 50, 255)
    meat_dark = (140, 60, 35, 255)
    bone_c = (220, 210, 190, 255)

    # Meat body
    for y in range(4, 12):
        for x in range(3, 12):
            px[x, y] = meat
    for x in range(4, 11):
        px[x, 3] = meat
        px[x, 12] = meat

    # Grill lines
    for x in range(4, 11):
        px[x, 6] = meat_dark
        px[x, 9] = meat_dark

    # Bone sticking out
    px[12, 7] = bone_c
    px[13, 7] = bone_c
    px[14, 7] = bone_c
    px[12, 8] = bone_c
    px[13, 8] = bone_c
    px[14, 6] = bone_c
    px[14, 8] = bone_c

    return img

def make_stick():
    """Stick item."""
    img = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    px = img.load()
    wood = (140, 100, 50, 255)
    wood_dark = (120, 80, 40, 255)

    for i in range(12):
        x = 3 + i
        y = 13 - i
        if 0 <= x < 16 and 0 <= y < 16:
            px[x, y] = wood
            if x + 1 < 16:
                px[x + 1, y] = wood_dark

    return img

def make_gel():
    """Slime gel item."""
    img = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    px = img.load()

    gel = (60, 200, 60, 180)
    gel_light = (100, 240, 100, 160)

    for y in range(5, 13):
        for x in range(4, 12):
            px[x, y] = gel
    for x in range(5, 11):
        px[x, 4] = gel
        px[x, 13] = gel

    px[5, 6] = gel_light
    px[6, 6] = gel_light
    px[6, 7] = gel_light

    return img

def make_bone_item():
    """Bone drop item."""
    img = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    px = img.load()
    bone = (220, 215, 200, 255)
    bone_dark = (190, 185, 170, 255)

    # Bone shaft
    for i in range(10):
        px[3 + i, 8] = bone
        px[3 + i, 9] = bone_dark

    # Knobs on ends
    for dy in [-1, 0, 1]:
        px[2, 8 + dy] = bone
        px[3, 7 + dy] = bone
        px[13, 8 + dy] = bone
        px[12, 7 + dy] = bone

    return img


# ============================================================
#  MAIN
# ============================================================

def main():
    blocks_dir = os.path.join(OUT, "Blocks")
    items_dir = os.path.join(OUT, "Items")
    player_dir = os.path.join(OUT, "Player")
    enemies_dir = os.path.join(OUT, "Enemies")

    random.seed(42)

    print("Generating block sprites...")
    block_sprites = {
        "Dirt": make_dirt(),
        "Grass": make_grass(),
        "Stone": make_stone(),
        "Wood": make_wood(),
        "Leaves": make_leaves(),
        "Bedrock": make_bedrock(),
        "Coal": make_coal(),
        "IronOre": make_iron_ore(),
        "GoldOre": make_gold_ore(),
        "DiamondOre": make_diamond_ore(),
        "Sand": make_sand(),
        "Cobblestone": make_cobblestone(),
        "Planks": make_planks(),
        "Workbench": make_workbench(),
        "Furnace": make_furnace(),
        "Torch": make_torch(),
    }
    for name, img in block_sprites.items():
        save(img, blocks_dir, name)
        print(f"  {name}.png")

    print("\nGenerating player sprites...")
    player_sprites = {
        "Player_Idle": make_player_idle(),
        "Player_Walk1": make_player_walk1(),
        "Player_Walk2": make_player_walk2(),
        "Player_Jump": make_player_jump(),
        "Player_Mine": make_player_mine(),
    }
    for name, img in player_sprites.items():
        save(img, player_dir, name)
        print(f"  {name}.png")

    print("\nGenerating enemy sprites...")
    enemy_sprites = {
        "Zombie": make_zombie(),
        "Slime": make_slime(),
        "Skeleton": make_skeleton(),
    }
    for name, img in enemy_sprites.items():
        save(img, enemies_dir, name)
        print(f"  {name}.png")

    print("\nGenerating item sprites...")
    # Tool tiers
    wood_color = (180, 130, 70, 255)
    stone_color = (140, 140, 140, 255)
    iron_color = (200, 200, 210, 255)
    gold_color = (255, 215, 0, 255)
    diamond_color = (100, 220, 255, 255)

    items = {}

    # Pickaxes
    for tier_name, color in [("Wood", wood_color), ("Stone", stone_color), ("Iron", iron_color), ("Gold", gold_color), ("Diamond", diamond_color)]:
        items[f"{tier_name}Pickaxe"] = make_item_pickaxe(color, tier_name)

    # Swords
    for tier_name, color in [("Wood", wood_color), ("Stone", stone_color), ("Iron", iron_color), ("Gold", gold_color), ("Diamond", diamond_color)]:
        items[f"{tier_name}Sword"] = make_item_sword(color, tier_name)

    # Axes
    for tier_name, color in [("Wood", wood_color), ("Stone", stone_color), ("Iron", iron_color)]:
        items[f"{tier_name}Axe"] = make_item_axe(color)

    # Bow
    items["Bow"] = make_item_bow()

    # Materials
    items["Stick"] = make_stick()
    items["CoalItem"] = make_item_generic((40, 40, 40, 255), "lump")
    items["IronIngot"] = make_item_generic((200, 200, 210, 255), "ingot")
    items["GoldIngot"] = make_item_generic((255, 215, 0, 255), "ingot")
    items["Diamond"] = make_item_generic((100, 220, 255, 255), "gem")
    items["WoodLog"] = make_item_generic((101, 67, 33, 255), "square")
    items["PlanksItem"] = make_item_generic((180, 130, 70, 255), "square")
    items["CobblestoneItem"] = make_item_generic((120, 120, 120, 255), "square")
    items["TorchItem"] = make_item_generic((200, 150, 50, 255), "square")

    # Block items (for placing)
    items["DirtItem"] = make_item_generic((139, 90, 43, 255), "square")
    items["StoneItem"] = make_item_generic((128, 128, 128, 255), "square")
    items["SandItem"] = make_item_generic((210, 190, 140, 255), "square")
    items["WorkbenchItem"] = make_item_generic((160, 115, 60, 255), "square")
    items["FurnaceItem"] = make_item_generic((130, 130, 130, 255), "square")

    # Food
    items["Apple"] = make_food_apple()
    items["CookedMeat"] = make_food_meat()

    # Enemy drops
    items["Gel"] = make_gel()
    items["Bone"] = make_bone_item()
    items["RottenFlesh"] = make_item_generic((120, 80, 70, 255), "lump")

    # Arrow
    items["Arrow"] = make_item_generic((160, 130, 80, 255), "square")  # Simple for now

    for name, img in items.items():
        save(img, items_dir, name)
        print(f"  {name}.png")

    total = len(block_sprites) + len(player_sprites) + len(enemy_sprites) + len(items)
    print(f"\nDone! Generated {total} sprites total.")
    print(f"  Blocks:  {len(block_sprites)}")
    print(f"  Player:  {len(player_sprites)}")
    print(f"  Enemies: {len(enemy_sprites)}")
    print(f"  Items:   {len(items)}")


if __name__ == "__main__":
    main()
