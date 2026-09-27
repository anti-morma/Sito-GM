"""Convert the local uint16 brain losslessly and transfer the reference's look.

Run: python scripts/convert-brain.py
Requires numpy and Pillow. Uses only assets/brain-source.bin and the existing
brain-reference.png. Coordinates, normals, point order and original shades are
preserved exactly. The separate material follows the volume's 3D cavities,
with the tonal distribution of the reference image used by the supplied site.
"""

from pathlib import Path
import hashlib
import json

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets' / 'brain-source.bin'
OUTPUT = ROOT / 'public' / 'brain-model.json'
COUNT = 65536


def surface_material(positions, normals, reference_values):
    """Transfer the reference's tonal distribution onto the actual 3D folds.

    Nearby geometry above a sample's tangent plane darkens its cavity. This
    lighting is baked in object space, so rotation never fades the material.
    """
    radius = 0.045
    cells = np.floor(positions / radius).astype(int)
    buckets = {}
    for i, cell in enumerate(cells):
        buckets.setdefault(tuple(cell), []).append(i)
    neighborhoods = {}
    for cell in buckets:
        neighborhoods[cell] = np.array([
            i for dx in (-1, 0, 1) for dy in (-1, 0, 1) for dz in (-1, 0, 1)
            for i in buckets.get((cell[0]+dx, cell[1]+dy, cell[2]+dz), [])
        ], dtype=int)
    cavity = np.zeros(len(positions))
    for i, point in enumerate(positions):
        neighbors = neighborhoods[tuple(cells[i])]
        offsets = positions[neighbors] - point
        distance = np.linalg.norm(offsets, axis=1)
        valid = (distance > 0.0035) & (distance < radius)
        distance, offsets = distance[valid], offsets[valid]
        if len(distance):
            weight = (1 - distance / radius) ** 2
            above = np.maximum(0, offsets @ normals[i] / distance - 0.025)
            cavity[i] = np.sum(above * weight) / np.sum(weight)
    # Smooth local sampling noise while respecting separate opposing folds.
    smooth = np.empty_like(cavity)
    for i, point in enumerate(positions):
        neighbors = neighborhoods[tuple(cells[i])]
        distance2 = np.sum((positions[neighbors] - point) ** 2, axis=1)
        valid = (distance2 < 0.015 ** 2) & (normals[neighbors] @ normals[i] > 0.7)
        neighbors, distance2 = neighbors[valid], distance2[valid]
        weight = np.exp(-distance2 / 0.009 ** 2)
        smooth[i] = np.sum(cavity[neighbors] * weight) / np.sum(weight)
    relief = np.exp(-smooth * 7) * (0.94 + 0.06 * normals[:, 1])
    # Match the same proportion of dark sulci and luminous ridges as the
    # reference; its 2D fold locations do not replace the anatomical relief.
    order = np.argsort(relief, kind='stable')
    appearance = np.empty(len(relief))
    appearance[order] = np.quantile(reference_values, (np.arange(len(relief)) + 0.5) / len(relief))
    print(f'Baked anatomical material: cavity range {smooth.min():.4f}–{smooth.max():.4f}', flush=True)
    return appearance


def main():
    source = SOURCE.read_bytes()
    data = np.frombuffer(source, dtype='<u2').reshape(-1, 7)
    if data.shape != (COUNT, 7):
        raise ValueError(f'Unexpected brain layout: {data.shape}')
    positions = data[:, :3].astype(float) / 32767.5 - 1
    normals = data[:, 3:6].astype(float) / 32767.5 - 1
    normals /= np.linalg.norm(normals, axis=1, keepdims=True)

    image = Image.open(ROOT / 'assets' / 'brain-reference.png').convert('RGB')
    if image.size != (1000, 1000):
        raise ValueError('Expected the original 1000 x 1000 brain reference')
    rgb = np.asarray(image, dtype=float) / 255
    smooth = np.asarray(image.filter(ImageFilter.GaussianBlur(11)), dtype=float) / 255
    value = 0.58 * rgb[:, :, 1] + 0.42 * rgb[:, :, 2]
    contrast = 0.58 * (rgb[:, :, 1] - smooth[:, :, 1]) + 0.42 * (rgb[:, :, 2] - smooth[:, :, 2])
    texture = np.clip(0.08 + 0.98 * value ** 1.35 + contrast * 0.5, 0.06, 1)

    # The previous reference's silhouette excludes the painted blue background.
    mask = Image.new('L', image.size)
    draw = ImageDraw.Draw(mask)
    draw.polygon([(170,510),(178,475),(193,443),(201,411),(222,381),
        (248,356),(270,331),(301,305),(342,278),(383,260),(431,248),
        (462,256),(489,244),(526,237),(572,241),(613,249),(655,260),
        (699,279),(740,305),(779,339),(813,376),(837,413),(849,444),
        (838,477),(847,509),(835,540),(813,564),(784,577),(746,581),
        (719,596),(711,626),(691,648),(656,664),(620,676),(575,677),
        (539,663),(506,670),(471,660),(435,656),(404,645),(375,649),
        (343,638),(312,644),(280,652),(251,671),(218,660),(192,637),
        (178,604),(169,565)], fill=255)
    draw.polygon([(262,661),(291,645),(326,640),(367,643),(411,651),
        (455,650),(491,656),(512,676),(503,705),(479,729),(444,749),
        (407,760),(363,762),(326,753),(294,737),(271,714),(259,684)], fill=255)
    draw.polygon([(470,646),(503,650),(527,668),(542,687),(530,711),
        (509,740),(490,774),(471,806),(450,830),(415,826),(423,792),
        (437,758),(445,726),(444,691)], fill=255)
    mask = np.asarray(mask.filter(ImageFilter.MinFilter(5))) > 0
    appearance = np.rint(surface_material(positions, normals, texture[mask]) * 65535).astype('<u2')
    model = {
        'version': 1, 'count': COUNT, 'stride': 7,
        'encoding': 'uint16', 'sourceSha256': hashlib.sha256(source).hexdigest(),
        'attribution': {
            'source': 'BodyParts3D v4.0, DBCLS, via Brain Atlas',
            'url': 'https://github.com/ssrpw2/brain-atlas',
            'revision': 'c20c30e9c4628b9d129ecf061ff8cce99f358490',
            'license': 'CC BY 4.0',
            'licenseUrl': 'https://creativecommons.org/licenses/by/4.0/',
            'changes': 'Anatomical surfaces sampled as stars; lossless format conversion; object-space cavity shading with the tonal distribution of the supplied reference.',
        },
        'points': data.ravel().tolist(), 'appearance': appearance.tolist(),
    }
    OUTPUT.write_text(json.dumps(model, separators=(',', ':')), encoding='utf-8')
    # Verify the saved conversion, including normals, order and original shade.
    saved = json.loads(OUTPUT.read_text(encoding='utf-8'))
    restored = np.asarray(saved['points'], dtype='<u2').tobytes()
    assert restored == source, 'Conversion altered the original binary data'
    print(f'{COUNT} points preserved byte for byte. SHA-256: {model["sourceSha256"]}')
    print(f'Wrote {OUTPUT.stat().st_size:,} bytes to {OUTPUT}')


if __name__ == '__main__':
    main()
