from PIL import Image
from pathlib import Path

SRC = Path(__file__).parent.parent / "assets"
OUT = SRC / "screenshots-asc"
OUT.mkdir(exist_ok=True)

TARGET_W, TARGET_H = 1320, 2868

for src in sorted(SRC.glob("IMG_99*.PNG")):
    img = Image.open(src).convert("RGB")
    w, h = img.size
    if (w, h) != (1290, 2796):
        print(f"SKIP {src.name}: unexpected size {w}x{h}")
        continue

    top_color = img.getpixel((w // 2, 0))
    bottom_color = img.getpixel((w // 2, h - 1))
    side_color = img.getpixel((0, h // 2))

    pad_x = (TARGET_W - w) // 2
    pad_y = (TARGET_H - h) // 2

    canvas = Image.new("RGB", (TARGET_W, TARGET_H), side_color)
    if top_color != side_color:
        canvas.paste(Image.new("RGB", (TARGET_W, pad_y), top_color), (0, 0))
    if bottom_color != side_color:
        canvas.paste(
            Image.new("RGB", (TARGET_W, TARGET_H - pad_y - h), bottom_color),
            (0, pad_y + h),
        )
    canvas.paste(img, (pad_x, pad_y))

    dst = OUT / src.name
    canvas.save(dst, "PNG")
    print(f"OK   {src.name}: sides={side_color} top={top_color} bot={bottom_color}")
