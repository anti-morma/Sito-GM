"""Bake only the reference's surface pattern; never modify the anatomy.

python scripts/build-brain-surface.py (NumPy, Pillow, SciPy)
The reference supplies a tonal palette, distributed in a continuous 3D field
on the anatomical surface. No positions or normals are changed.
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
reference = Image.open(ROOT / 'assets/brain-reference.png').convert('RGB')
rgb = np.asarray(reference, dtype=float) / 255
smooth = np.asarray(reference.filter(ImageFilter.GaussianBlur(11)), dtype=float) / 255
value = .58 * rgb[:, :, 1] + .42 * rgb[:, :, 2]
contrast = .58 * (rgb[:, :, 1] - smooth[:, :, 1]) + .42 * (rgb[:, :, 2] - smooth[:, :, 2])
tone = np.clip(.08 + .98 * value ** 1.35 + .5 * contrast, .06, 1)
# Sample its foreground tone distribution without projecting the photograph's
# creases onto a different anatomy. Each star's tone remains fixed in space.
rng = np.random.default_rng(19381)
star_tone = np.quantile(tone[value > .12], rng.random(count))

# Seeded 3D value noise gives neighbouring samples related tones, with no
# texture seams or dependence on the camera's direction.
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

w = noise(points[:, 0]*7, points[:, 1]*7, points[:, 2]*7)*.7
broad = noise(points[:, 0]*11+w, points[:, 1]*11-w, points[:, 2]*11+w)
grain = noise(points[:, 0]*35, points[:, 1]*35, points[:, 2]*35)
# Spatially connected soft patches, with individual bright and faint stars.
# There are no arbitrary point-index layers and no view-dependent material.
envelope = .92 + .16*broad + .06*grain
shade = (.46 + .54*star_tone) * envelope

# Anatomy contributes only subdued cavity shading, not a rank ordering that
# assigns every brightest star to a crest. Important regions keep more depth.
source_rows = np.frombuffer((ROOT / 'assets/brain-source.bin').read_bytes(), dtype='<u2').reshape(-1, 7)
source_positions = source_rows[:, :3].astype(float) / 32767.5 - 1
archive = json.loads((ROOT / 'public/brain-model.json').read_text())
if archive['sourceSha256'] != hashlib.sha256(source_rows.tobytes()).hexdigest() or len(archive['appearance']) != len(source_positions):
    raise ValueError('Anatomical appearance does not match the source')
near = cKDTree(source_positions).query(points, workers=-1)[1]
relief = np.asarray(archive['appearance'])[near] / 65535
# Smooth regional masks protect the central and lower folds. The midline
# mask follows the separation of the hemispheres along the object's z axis.
central = np.exp(-((points[:, 0] - .065) / .075) ** 2)
central *= np.clip((points[:, 1] + .13) / .09, 0, 1)
cerebellum = np.clip((-.07 - points[:, 1]) / .12, 0, 1)
midline = np.exp(-(points[:, 2]/.023)**2) * np.clip((points[:, 1]-.02)/.10, 0, 1)
landmark = np.maximum(np.maximum(central, cerebellum), midline)
cavity_strength = .16 + .29*landmark
shade *= 1 - cavity_strength * (1-relief)

material = np.rint(np.clip(shade, .06, 1)*255).astype('u1')
output = struct.pack('<4sIII', b'GMSF', 9, count, 1) + material.tobytes()
(ROOT / 'public/brain-surface.bin').write_bytes(output)
print(f'Baked {count:,} material samples; anatomical SHA-256 unchanged: {hashlib.sha256(geometry).hexdigest()}')
