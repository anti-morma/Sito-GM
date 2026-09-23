"""Extract particle geometry from the supplied blue brain reference.

Run: python scripts/sample-brain.py
The source image is kept outside public/; the site loads only brain-points.json.
"""

from pathlib import Path
import json
import math
import random

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "assets" / "brain-reference.png"
OUTPUT = ROOT / "app" / "brain-points.json"
COUNT = 32768
RNG = random.Random(61904)

image = Image.open(SOURCE).convert("RGB")
if image.size != (1000, 1000):
    raise ValueError(f"Expected a 1000x1000 reference, received {image.size}")

parts = [
    # Lateral cortex: the outline follows the illuminated outer gyri.
    [(170, 510), (178, 475), (193, 443), (201, 411), (222, 381),
     (248, 356), (270, 331), (301, 305), (342, 278), (383, 260),
     (431, 248), (462, 256), (489, 244), (526, 237), (572, 241),
     (613, 249), (655, 260), (699, 279), (740, 305), (779, 339),
     (813, 376), (837, 413), (849, 444), (838, 477), (847, 509),
     (835, 540), (813, 564), (784, 577), (746, 581), (719, 596),
     (711, 626), (691, 648), (656, 664), (620, 676), (575, 677),
     (539, 663), (506, 670), (471, 660), (435, 656), (404, 645),
     (375, 649), (343, 638), (312, 644), (280, 652), (251, 671),
     (218, 660), (192, 637), (178, 604), (169, 565)],
    # The tucked, densely folded cerebellum.
    [(262, 661), (291, 645), (326, 640), (367, 643), (411, 651),
     (455, 650), (491, 656), (512, 676), (503, 705), (479, 729),
     (444, 749), (407, 760), (363, 762), (326, 753), (294, 737),
     (271, 714), (259, 684)],
    # Pons and medulla, visible below the temporal lobe.
    [(470, 646), (503, 650), (527, 668), (542, 687), (530, 711),
     (509, 740), (490, 774), (471, 806), (450, 830), (415, 826),
     (423, 792), (437, 758), (445, 726), (444, 691)],
]

masks = []
for polygon in parts:
    mask = Image.new("L", image.size)
    ImageDraw.Draw(mask).polygon(polygon, fill=255)
    masks.append(mask)

combined = Image.new("L", image.size)
for mask in masks:
    combined = Image.frombytes("L", image.size, bytes(max(a, b) for a, b in zip(combined.tobytes(), mask.tobytes())))
eroded = combined.filter(ImageFilter.MinFilter(11))
blurred = image.filter(ImageFilter.GaussianBlur(11))

pixels = image.load()
smooth = blurred.load()
inside = combined.load()
interior = eroded.load()
part_pixels = [mask.load() for mask in masks]

# One sample per small cell avoids accidental clusters that obscure the sulci.
cells = []
edge_cells = []
for cy in range(235, 835, 2):
    for cx in range(165, 855, 2):
        choices = [(cx + dx, cy + dy) for dy in (0, 1) for dx in (0, 1)
                   if inside[cx + dx, cy + dy]]
        if not choices:
            continue
        candidate = RNG.choice(choices)
        cells.append(candidate)
        if not interior[candidate]:
            edge_cells.append(candidate)

RNG.shuffle(cells)
RNG.shuffle(edge_cells)
selected = cells[:COUNT - 1200] + edge_cells[:1200]
if len(selected) != COUNT:
    raise ValueError(f"Only {len(selected)} samples available")
RNG.shuffle(selected)

points = []
for x, y in selected:
    _, green, blue = pixels[x, y]
    _, smooth_green, smooth_blue = smooth[x, y]
    value = 0.58 * green / 255 + 0.42 * blue / 255
    local_contrast = 0.58 * (green - smooth_green) / 255 + 0.42 * (blue - smooth_blue) / 255
    shade = min(1, max(0.06, 0.08 + 0.98 * value ** 1.35 + local_contrast * 0.5))

    if part_pixels[2][x, y] and y > 672:
        radial = ((x - 478) / 66) ** 2 + ((y - 718) / 125) ** 2
        z = -0.018 + 0.065 * math.sqrt(max(0, 1 - radial))
    elif part_pixels[1][x, y] and y > 645:
        radial = ((x - 385) / 145) ** 2 + ((y - 693) / 82) ** 2
        z = -0.008 + 0.085 * math.sqrt(max(0, 1 - radial))
    else:
        radial = ((x - 510) / 350) ** 2 + ((y - 456) / 239) ** 2
        z = 0.012 + 0.105 * math.sqrt(max(0, 1 - radial))

    # Image y runs downward; the world origin is near the cortical center.
    points.append([round((x - 510) * 0.001, 4),
                   round((535 - y) * 0.001, 4),
                   round(z, 4), round(shade, 4)])

OUTPUT.write_text(json.dumps(points, separators=(",", ":")), encoding="utf-8")
print(f"Wrote {len(points)} points to {OUTPUT} ({OUTPUT.stat().st_size:,} bytes)")
