"""
Render the AnimatedSplash first frame into a static PNG. Used as the
expo-splash-screen icon so the native iOS launch screen matches the JS
animation's starting frame exactly — no size/position pop on handoff.
"""
from PIL import Image, ImageDraw
from pathlib import Path

OUT = Path(__file__).parent.parent / "assets" / "splash-icon.png"

TILE = 140
SCALE = 8
W = TILE * SCALE  # 1120

GRAD_TOP = (216, 106, 62)        # #D86A3E
GRAD_MID = (194, 86, 46)         # #C2562E (terracotta)
GRAD_BOT = (168, 69, 31)         # #A8451F (terracottaDeep)
F_COLOR = (255, 247, 238, 255)   # #FFF7EE
RADIUS = int(TILE * 0.226 * SCALE)


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


img = Image.new("RGBA", (W, W), (0, 0, 0, 0))

tile = Image.new("RGBA", (W, W), (0, 0, 0, 0))
px = tile.load()
for y in range(W):
    t = y / (W - 1)
    if t < 0.55:
        c = lerp(GRAD_TOP, GRAD_MID, t / 0.55)
    else:
        c = lerp(GRAD_MID, GRAD_BOT, (t - 0.55) / 0.45)
    for x in range(W):
        px[x, y] = (*c, 255)

mask = Image.new("L", (W, W), 0)
ImageDraw.Draw(mask).rounded_rectangle((0, 0, W, W), radius=RADIUS, fill=255)
img.paste(tile, (0, 0), mask)

draw = ImageDraw.Draw(img)


def rect(x, y, w, h):
    draw.rectangle(
        (x * SCALE, y * SCALE, (x + w) * SCALE, (y + h) * SCALE),
        fill=F_COLOR,
    )


# F (positions from AnimatedSplash.js styles)
rect(50, 68, 42, 8)   # top bar
rect(50, 68, 8, 52)   # vertical
rect(50, 89, 30, 7)   # mid bar

# ° ring at REST_Y (left=54, top=28, 32x32, borderWidth=8, transparent center)
ring_outer = (54 * SCALE, 28 * SCALE, (54 + 32) * SCALE, (28 + 32) * SCALE)
ring_inner_pad = 8 * SCALE
ring_inner = (
    ring_outer[0] + ring_inner_pad,
    ring_outer[1] + ring_inner_pad,
    ring_outer[2] - ring_inner_pad,
    ring_outer[3] - ring_inner_pad,
)
draw.ellipse(ring_outer, fill=F_COLOR)
# Punch the inner hole back to terracotta-mid (matches gradient at this y)
center_y_norm = (28 + 16) / TILE
if center_y_norm < 0.55:
    inner_color = lerp(GRAD_TOP, GRAD_MID, center_y_norm / 0.55)
else:
    inner_color = lerp(GRAD_MID, GRAD_BOT, (center_y_norm - 0.55) / 0.45)
draw.ellipse(ring_inner, fill=(*inner_color, 255))

img.save(OUT, "PNG")
print(f"Wrote {OUT.name} ({W}x{W})")
