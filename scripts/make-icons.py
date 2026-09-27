"""Generates the WowCity app icon, Android adaptive icon layers, splash and favicon.

Run: python3 scripts/make-icons.py  (needs Pillow)
"""
from PIL import Image, ImageDraw, ImageFont

BLUE_TOP = (47, 111, 226)
BLUE_BOTTOM = (22, 76, 184)
WHITE = (255, 255, 255, 255)
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
SS = 4  # supersampling


def gradient(size):
    img = Image.new("RGBA", (size, size))
    d = ImageDraw.Draw(img)
    for y in range(size):
        t = y / (size - 1)
        c = tuple(round(a + (b - a) * t) for a, b in zip(BLUE_TOP, BLUE_BOTTOM))
        d.line([(0, y), (size, y)], fill=c + (255,))
    return img


def pin(size, scale, cutout, fill=WHITE, letter_fill=None):
    """A map pin with a 'W' inside, centred, `scale` = pin height / size."""
    s = size * SS
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    h = s * scale
    r = h * 0.36
    cx, cy = s / 2, s / 2 - h * 0.14
    tip = cy + h * 0.64
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=fill)
    d.polygon([(cx - r * 0.78, cy + r * 0.62), (cx + r * 0.78, cy + r * 0.62), (cx, tip)], fill=fill)
    font = ImageFont.truetype(FONT, int(r * 1.05))
    box = d.textbbox((0, 0), "W", font=font)
    tw, th = box[2] - box[0], box[3] - box[1]
    pos = (cx - tw / 2 - box[0], cy - th / 2 - box[1])
    if cutout:
        mask = Image.new("L", (s, s), 0)
        ImageDraw.Draw(mask).text(pos, "W", font=font, fill=255)
        img.putalpha(Image.eval(Image.composite(Image.new("L", (s, s), 0), img.getchannel("A"), mask), lambda v: v))
    else:
        d.text(pos, "W", font=font, fill=letter_fill)
    return img.resize((size, size), Image.LANCZOS)


icon = gradient(1024)
icon.alpha_composite(pin(1024, 0.62, cutout=False, letter_fill=BLUE_BOTTOM + (255,)))
icon.convert("RGB").save("assets/icon.png")

gradient(512).save("assets/android-icon-background.png")
pin(512, 0.42, cutout=False, letter_fill=BLUE_BOTTOM + (255,)).save("assets/android-icon-foreground.png")
pin(432, 0.42, cutout=True).save("assets/android-icon-monochrome.png")

splash = pin(1024, 0.8, cutout=False, fill=BLUE_BOTTOM + (255,), letter_fill=WHITE)
splash.save("assets/splash-icon.png")

fav = gradient(192)
fav.alpha_composite(pin(192, 0.7, cutout=False, letter_fill=BLUE_BOTTOM + (255,)))
fav.resize((48, 48), Image.LANCZOS).save("assets/favicon.png")
print("icons written")
