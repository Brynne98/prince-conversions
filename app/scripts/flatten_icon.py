from PIL import Image
from pathlib import Path

ASSETS = Path(__file__).parent.parent / "assets"
SRC = ASSETS / "icon.png"
DST = ASSETS / "icon-ios.png"

img = Image.open(SRC).convert("RGBA")
w, h = img.size

samples = [
    img.getpixel((w // 2, h // 4)),
    img.getpixel((w // 4, h // 2)),
    img.getpixel((3 * w // 4, h // 2)),
    img.getpixel((w // 2, 3 * h // 4)),
]
opaque = [s for s in samples if s[3] > 250]
r = sum(s[0] for s in opaque) // len(opaque)
g = sum(s[1] for s in opaque) // len(opaque)
b = sum(s[2] for s in opaque) // len(opaque)
bg = (r, g, b)

canvas = Image.new("RGB", (w, h), bg)
canvas.paste(img, (0, 0), img)
canvas.save(DST, "PNG")
print(f"Flattened {SRC.name} -> {DST.name} (bg=#{r:02X}{g:02X}{b:02X}, {w}x{h}, no alpha)")
