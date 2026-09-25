// Shared by the star samplers (sample-gm.mjs, sample-gomore.mjs).

// Exact Euclidean distance transform (Felzenszwalb & Huttenlocher).
export function distanceField(target, width, height) {
  const size = width * height;
  const INF = 1e12;
  const grid = new Float64Array(size);
  for (let i = 0; i < size; i++) grid[i] = target[i] ? 0 : INF;
  const n = Math.max(width, height);
  const f = new Float64Array(n), d = new Float64Array(n), z = new Float64Array(n + 1);
  const v = new Int32Array(n);
  const pass = (length, get, set) => {
    for (let q = 0; q < length; q++) f[q] = get(q);
    let k = 0;
    v[0] = 0; z[0] = -INF; z[1] = INF;
    for (let q = 1; q < length; q++) {
      let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      while (s <= z[k]) { k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
      k++; v[k] = q; z[k] = s; z[k + 1] = INF;
    }
    k = 0;
    for (let q = 0; q < length; q++) {
      while (z[k + 1] < q) k++;
      d[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
    }
    for (let q = 0; q < length; q++) set(q, d[q]);
  };
  for (let x = 0; x < width; x++) pass(height, (y) => grid[y * width + x], (y, value) => { grid[y * width + x] = value; });
  for (let y = 0; y < height; y++) pass(width, (x) => grid[y * width + x], (x, value) => { grid[y * width + x] = value; });
  for (let i = 0; i < size; i++) grid[i] = Math.sqrt(grid[i]);
  return grid;
}
