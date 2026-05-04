"""
Render the recipe-card icon (design/App Icon.html) into PNGs for every
asset slot. Generates:
  assets/icon.png         — 1024x1024 RGBA, squircle with alpha corners
  assets/icon-ios.png     — 1024x1024 RGB, alpha-flattened over cream
                            (iOS app icons cannot have alpha)
  assets/adaptive-icon.png — 1024x1024 RGBA, Android adaptive foreground
                            (kept centered within 66% safe zone)
  assets/favicon.png      — 64x64 RGBA for web
  assets/splash-icon.png  — 1024x1024 RGBA, used by expo-splash-screen
                            so native launch matches AnimatedSplash

Run: python3 scripts/build_icons.py
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

ASSETS = Path(__file__).parent.parent / "assets"
FONTS = Path("/tmp/caveat-fonts")
CAVEAT_BOLD = FONTS / "Caveat-Bold.ttf"
CAVEAT_SEMIBOLD = FONTS / "Caveat-SemiBold.ttf"

# Colors from design/App Icon.html
BG = (251, 246, 236, 255)       # #fbf6ec — paper / cream
RULING = (241, 234, 217, 255)   # #f1ead9 — notebook ruling
INK = (42, 32, 26, 255)         # #2a201a — dark border + top text
TERRACOTTA = (194, 90, 53, 255) # #c25a35 — divider + bottom text


def render_card(size, *, alpha_corners=True, safe_zone=False, foreground_only=False):
    """Render the recipe-card icon at a given size.

    alpha_corners:    if True, transparent outside the squircle. If False,
                      fill corners with BG (used for iOS).
    safe_zone:        if True, scale the design down to fit within 66% of
                      the canvas (Android adaptive icons crop the outer 33%).
    foreground_only:  if True, omit the card bg/ruling/border — Android
                      adaptive icons supply their own background, so the
                      foreground PNG should be just the inked content.
    """
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    radius = int(size * 0.225)
    border_w = max(1, round(size * 0.009))

    if not foreground_only:
        # Card body
        draw.rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=BG)

        # Notebook ruling lines — every 11.8% of size, ~0.4% line thickness,
        # offset 6% from top.
        line_gap = size * 0.118
        line_h = max(2, round(size * 0.004))
        y = size * 0.06
        while y < size:
            y0 = round(y)
            draw.rectangle((0, y0, size, y0 + line_h - 1), fill=RULING)
            y += line_gap

        # Border ring
        draw.rounded_rectangle(
            (0, 0, size - 1, size - 1),
            radius=radius,
            outline=INK,
            width=border_w,
        )

    # Stack: "425°" / divider / "400°", centered.
    # Mirrors the CSS flex column with line-height: 1, so each text's
    # line-box height == its font-size, and we center each line-box.
    top_size = round(size * 0.30)
    bot_size = round(size * 0.18)
    gap = round(size * 0.024)
    div_w = round(size * 0.46)
    div_h = max(2, round(size * 0.012))

    top_font = ImageFont.truetype(str(CAVEAT_BOLD), top_size)
    bot_font = ImageFont.truetype(str(CAVEAT_SEMIBOLD), bot_size)

    stack_h = top_size + gap + div_h + gap + bot_size
    stack_top = (size - stack_h) // 2
    cx = size // 2

    top_center_y = stack_top + top_size // 2
    div_top = stack_top + top_size + gap
    bot_center_y = div_top + div_h + gap + bot_size // 2

    # anchor="mm" centers glyph at the given (x, y) — line-box equivalent.
    draw.text((cx, top_center_y), "425°",
              fill=INK, font=top_font, anchor="mm")
    draw.rounded_rectangle(
        (cx - div_w // 2, div_top, cx - div_w // 2 + div_w, div_top + div_h),
        radius=div_h // 2,
        fill=TERRACOTTA,
    )
    draw.text((cx, bot_center_y), "400°",
              fill=TERRACOTTA, font=bot_font, anchor="mm")

    if not alpha_corners:
        flat = Image.new("RGB", (size, size), BG[:3])
        flat.paste(img, (0, 0), img)
        return flat

    if foreground_only:
        out = img  # text already on transparent canvas
    else:
        # Mask everything outside the squircle to transparent
        mask = Image.new("L", (size, size), 0)
        ImageDraw.Draw(mask).rounded_rectangle(
            (0, 0, size - 1, size - 1), radius=radius, fill=255,
        )
        out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        out.paste(img, (0, 0), mask)

    if safe_zone:
        # Shrink to 66% and re-center on transparent canvas
        inner = round(size * 0.66)
        small = out.resize((inner, inner), Image.LANCZOS)
        canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        offset = (size - inner) // 2
        canvas.paste(small, (offset, offset), small)
        return canvas

    return out


def main():
    # 1. Primary icon (RGBA, squircle)
    icon = render_card(1024, alpha_corners=True)
    icon.save(ASSETS / "icon.png", "PNG")
    print(f"icon.png        ({icon.size}, {icon.mode})")

    # 2. iOS icon (RGB, no alpha — required by App Store)
    icon_ios = render_card(1024, alpha_corners=False)
    icon_ios.save(ASSETS / "icon-ios.png", "PNG")
    print(f"icon-ios.png    ({icon_ios.size}, {icon_ios.mode})")

    # 3. Android adaptive (text-only foreground; Android composites it
    #    onto adaptiveIcon.backgroundColor)
    adaptive = render_card(1024, alpha_corners=True, safe_zone=True,
                           foreground_only=True)
    adaptive.save(ASSETS / "adaptive-icon.png", "PNG")
    print(f"adaptive-icon.png ({adaptive.size}, {adaptive.mode})")

    # 4. Web favicon
    favicon = render_card(64, alpha_corners=True)
    favicon.save(ASSETS / "favicon.png", "PNG")
    print(f"favicon.png     ({favicon.size}, {favicon.mode})")

    # 5. Splash icon (matches native expo-splash-screen image)
    splash = render_card(1024, alpha_corners=True)
    splash.save(ASSETS / "splash-icon.png", "PNG")
    print(f"splash-icon.png ({splash.size}, {splash.mode})")


if __name__ == "__main__":
    main()
