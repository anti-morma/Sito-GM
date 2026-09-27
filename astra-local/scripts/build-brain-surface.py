"""Bake only the reference's surface pattern; never modify the anatomy.

python scripts/build-brain-surface.py (NumPy, Pillow, SciPy)
The reference image supplies the same local shade used by the original site.
The front, rim, far and two fill groups reproduce its five material layers
on the existing anatomical points. No positions or normals are changed.
"""
from pathlib import Path
import hashlib
import json
import struct

import numpy as np
from PIL import Image, ImageFilter
from scipy.spatial import cKDTree

ROOT = Path(__file__).resolve().parents[1]
geometry = (ROOT / 'public/brain-sculpture.bin').read_bytes()
magic, version, count, stride = struct.unpack('<4sIII', geometry[:16])
if (magic, version, count, stride) != (b'GMBR', 2, 196608, 8):
    raise ValueError('Unexpected anatomical surface')
points = np.frombuffer(geometry[16:], dtype='<u2').reshape(count, stride)[:, :3] / 32767.5 - 1
normals = np.frombuffer(geometry[16:], dtype='<u2').reshape(count, stride)[:, 3:6] / 32767.5 - 1
reference = Image.open(ROOT / 'assets/brain-reference.png').convert('RGB')
rgb = np.asarray(reference, dtype=float) / 255
smooth = np.asarray(reference.filter(ImageFilter.GaussianBlur(11)), dtype=float) / 255
value = .58 * rgb[:, :, 1] + .42 * rgb[:, :, 2]
contrast = .58 * (rgb[:, :, 1] - smooth[:, :, 1]) + .42 * (rgb[:, :, 2] - smooth[:, :, 2])
tone = np.clip(.08 + .98 * value ** 1.35 + .5 * contrast, .06, 1)
# The old site's reference drawing faces right; the anatomical source faces
# left. This decal is fixed in object space and continues over both hemispheres.
x = np.clip(510 - points[:, 0] * 946, 0, 998)
y = np.clip(535 - points[:, 1] * 895, 0, 998)
ix, iy = x.astype(int), y.astype(int)
fx, fy = x - ix, y - iy
shade = ((tone[iy, ix] * (1-fx) + tone[iy, ix+1] * fx) * (1-fy)
         + (tone[iy+1, ix] * (1-fx) + tone[iy+1, ix+1] * fx) * fy)

# Seeded 3D value noise follows the same warped ridge recipe as the original
# reference volume. It varies the rim and fill material in object space.
table = np.random.default_rng(601).random(4096) * 2 - 1


def noise(x, y, z):
    X, Y, Z = np.floor(x).astype(np.int64), np.floor(y).astype(np.int64), np.floor(z).astype(np.int64)
    u, v, w = x-X, y-Y, z-Z
    u, v, w = u*u*(3-2*u), v*v*(3-2*v), w*w*(3-2*w)
    def corner(dx, dy, dz):
        return table[((X+dx)*73856093 ^ (Y+dy)*19349663 ^ (Z+dz)*83492791) & 4095]
    low = ((corner(0,0,0)*(1-u)+corner(1,0,0)*u)*(1-v)
           +(corner(0,1,0)*(1-u)+corner(1,1,0)*u)*v)
    high = ((corner(0,0,1)*(1-u)+corner(1,0,1)*u)*(1-v)
            +(corner(0,1,1)*(1-u)+corner(1,1,1)*u)*v)
    return low*(1-w)+high*w

w = noise(points[:, 0]*9, points[:, 1]*9, points[:, 2]*9)*.9
ridge = np.abs(noise(points[:, 0]*24+w, points[:, 1]*24-w, points[:, 2]*24+w))
gyrus = np.clip((ridge-.04)/.3, 0, 1)
blend = np.clip(np.abs(normals[:, 2])/.72, 0, 1)*.6
rim = (.1+.8*gyrus)*(1-blend)+shade*blend
fill = .64+.14*gyrus+.10*shade
roles = np.arange(count) % 5
shade = np.where(roles == 1, rim, np.where(roles >= 3, fill, shade))

# Keep the exact tonal distribution of every reference layer, but place its
# bright cells on the actual anatomical crests and its dark cells in the real
# sulci. The archived appearance was baked from local 3D cavities, and its
# nearest source sample is within the small interpolation neighbourhood.
source_rows = np.frombuffer((ROOT / 'assets/brain-source.bin').read_bytes(), dtype='<u2').reshape(-1, 7)
source_positions = source_rows[:, :3].astype(float) / 32767.5 - 1
archive = json.loads((ROOT / 'public/brain-model.json').read_text())
if archive['sourceSha256'] != hashlib.sha256(source_rows.tobytes()).hexdigest() or len(archive['appearance']) != len(source_positions):
    raise ValueError('Anatomical appearance does not match the source')
near = cKDTree(source_positions).query(points, workers=-1)[1]
relief = np.asarray(archive['appearance'])[near] / 65535
for role in range(5):
    indices = np.flatnonzero(roles == role)
    group = shade[indices].copy()
    score = .75 * relief[indices] + .25 * group
    shade[indices[np.argsort(score, kind='stable')]] = np.sort(group)

# Keep the central furrow and the tightly folded cerebellum crisp. Elsewhere,
# lift only the deepest tones of the three contour layers; the secondary
# furrows remain visible without competing with the main anatomical landmarks.
central = np.exp(-((points[:, 0] - .065) / .075) ** 2)
central *= np.clip((points[:, 1] + .13) / .09, 0, 1)
cerebellum = np.clip((-.07 - points[:, 1]) / .12, 0, 1)
landmark = np.maximum(central, cerebellum)
secondary_softening = .12 * (1 - landmark)
shade = np.where(roles <= 2, shade * (1 - secondary_softening) + .52 * secondary_softening, shade)
# The far and soft-fill roles supply depth, but should not read as an exposed
# inner volume. Keep their colors and size variation while reducing their glow.
shade = np.where(roles == 2, shade * .88, shade)
shade = np.where(roles >= 3, shade * .94, shade)

material = np.rint(np.clip(shade, .06, 1)*255).astype('u1')
output = struct.pack('<4sIII', b'GMSF', 7, count, 1) + material.tobytes()
(ROOT / 'public/brain-surface.bin').write_bytes(output)
print(f'Baked {count:,} material samples; anatomical SHA-256 unchanged: {hashlib.sha256(geometry).hexdigest()}')
