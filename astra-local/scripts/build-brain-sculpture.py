"""Resample the original anatomical surface with uniformly spaced stars.

Run: python scripts/build-brain-sculpture.py (NumPy and SciPy).
All local triangles use original positions and compatible outward normals.
No silhouette inflation, image projection, displacement or reference geometry.
The seed, sample order and packed output are deterministic. The mobile prefix
and complete desktop cloud each receive their own spacing pass.
"""
from pathlib import Path
import hashlib
import json
import struct

import numpy as np
from scipy.spatial import cKDTree, Delaunay, QhullError

ROOT = Path(__file__).resolve().parents[1]
DESKTOP_COUNT = 196608
MOBILE_COUNT = 98304
RNG = np.random.default_rng(601)


def main():
    source = (ROOT / 'assets/brain-source.bin').read_bytes()
    rows = np.frombuffer(source, dtype='<u2').reshape(-1, 7)
    if rows.shape != (65536, 7):
        raise ValueError('Unexpected anatomical source')
    p = rows[:, :3].astype(float) / 32767.5 - 1
    n = rows[:, 3:6].astype(float) / 32767.5 - 1
    n /= np.linalg.norm(n, axis=1, keepdims=True)
    tree = cKDTree(p)
    distances, neighbors = tree.query(p, k=24, workers=-1)
    faces = set()
    for i in range(len(p)):
        adjacent = neighbors[i, 1:]
        offset = p[adjacent] - p[i]
        distance = distances[i, 1:]
        valid = ((distance < .025) & (distance > .0003)
                 & (n[adjacent] @ n[i] > .55)
                 & (np.abs(offset @ n[i]) < distance * .40 + .0004)
                 & (np.abs(np.sum(offset * n[adjacent], axis=1)) < distance * .40 + .0004))
        adjacent = adjacent[valid]
        if len(adjacent) < 3:
            continue
        indices = np.concatenate(([i], adjacent))
        tangent = np.cross(n[i], [0, 1, 0] if abs(n[i, 1]) < .9 else [1, 0, 0])
        tangent /= np.linalg.norm(tangent)
        bitangent = np.cross(n[i], tangent)
        delta = p[indices] - p[i]
        xy = np.column_stack((delta @ tangent, delta @ bitangent))
        try:
            triangles = Delaunay(xy).simplices
        except QhullError:
            continue
        for triangle in triangles[np.any(triangles == 0, axis=1)]:
            ids = indices[triangle]
            a, b, c = p[ids]
            cross = np.cross(b - a, c - a)
            area = np.linalg.norm(cross)
            # Short, non-degenerate triangles only; do not bridge opposing gyri.
            if area < 1e-8 or max(np.linalg.norm(a-b), np.linalg.norm(b-c), np.linalg.norm(c-a)) > .025:
                continue
            if min(n[ids[0]] @ n[ids[1]], n[ids[1]] @ n[ids[2]], n[ids[2]] @ n[ids[0]]) < .55:
                continue
            if abs(cross @ n[i]) / area < .65:
                continue
            faces.add(tuple(sorted(int(j) for j in ids)))
    faces = np.array(sorted(faces))
    vertices = p[faces]
    area = np.linalg.norm(np.cross(vertices[:, 1]-vertices[:, 0], vertices[:, 2]-vertices[:, 0]), axis=1)
    print(f'Local surface: {len(faces):,} triangles', flush=True)
    # Oversample by area, then reject neighbours instead of dimming clusters.
    choices = RNG.choice(len(faces), 1500000, p=area/area.sum())
    roots = np.sqrt(RNG.random(len(choices)))
    split = RNG.random(len(choices))
    barycentric = np.column_stack((1-roots, roots*(1-split), roots*split))
    candidates = np.sum(p[faces[choices]] * barycentric[:, :, None], axis=1)
    normals = np.sum(n[faces[choices]] * barycentric[:, :, None], axis=1)
    normals /= np.linalg.norm(normals, axis=1, keepdims=True)
    # Preserve actual extremes and include the source samples in the same pool.
    candidates = np.concatenate((p, candidates))
    normals = np.concatenate((n, normals))
    search = cKDTree(candidates)
    order = RNG.permutation(len(candidates))
    selected = list(dict.fromkeys([*np.argmin(p, axis=0), *np.argmax(p, axis=0)]))
    chosen = np.zeros(len(candidates), dtype=bool)
    chosen[selected] = True
    for target, initial_radius in [(MOBILE_COUNT, .0042), (DESKTOP_COUNT, .0029)]:
        radius = initial_radius
        while len(selected) < target:
            excluded = chosen.copy()
            for j in selected:
                near = np.asarray(search.query_ball_point(candidates[j], radius))
                excluded[near[normals[near] @ normals[j] > .4]] = True
            for j in order:
                if excluded[j]:
                    continue
                selected.append(j)
                chosen[j] = True
                near = np.asarray(search.query_ball_point(candidates[j], radius))
                excluded[near[normals[near] @ normals[j] > .4]] = True
                if len(selected) == target:
                    break
            print(f'Spacing {radius:.5f}: {len(selected):,} stars', flush=True)
            radius *= .92
            if radius < .0005 and len(selected) < target:
                raise RuntimeError('Could not cover anatomical surface')
    selected = np.asarray(selected)
    samples = np.column_stack((candidates[selected], normals[selected]))
    packed = np.empty((DESKTOP_COUNT, 8), dtype='<u2')
    packed[:, :6] = np.rint((np.clip(samples, -1, 1) + 1) * 32767.5).astype('<u2')
    packed[:, 6:] = 65535  # Equal intensity/contribution; never baked image shading.
    output = struct.pack('<4sIII', b'GMBR', 2, DESKTOP_COUNT, 8) + packed.tobytes()
    (ROOT / 'public/brain-sculpture.bin').write_bytes(output)
    nearest = tree.query(samples[:, :3], workers=-1)[0]
    metadata = {
        'version': 2, 'count': DESKTOP_COUNT, 'mobileCount': MOBILE_COUNT,
        'sourceSha256': hashlib.sha256(source).hexdigest(),
        'sha256': hashlib.sha256(output).hexdigest(),
        'geometry': 'Original positions and local barycentric interpolation; no silhouette deformation',
        'material': 'Constant star size and intensity; progressive blue-noise surface coverage',
        'maxDistanceToSourceSample': float(nearest.max()),
        'bounds': [samples[:, :3].min(axis=0).tolist(), samples[:, :3].max(axis=0).tolist()],
        'attribution': {
            'source': 'BodyParts3D v4.0, DBCLS, via Brain Atlas',
            'url': 'https://github.com/ssrpw2/brain-atlas',
            'revision': 'c20c30e9c4628b9d129ecf061ff8cce99f358490',
            'license': 'CC BY 4.0',
            'licenseUrl': 'https://creativecommons.org/licenses/by/4.0/',
            'changes': 'Local anatomical surface resampling with uniform particle spacing and intensity.',
        },
    }
    (ROOT / 'public/brain-sculpture.json').write_text(json.dumps(metadata, indent=2) + '\n')
    print(json.dumps(metadata), flush=True)


if __name__ == '__main__':
    main()
