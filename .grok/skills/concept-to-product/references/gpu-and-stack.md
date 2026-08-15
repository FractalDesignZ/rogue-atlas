# GPU and stack

Expect **high-end consumer and commercial GPUs**. Do not costume a CPU
walk as a GPU product, and do not stall the live preview on a Python
service that is not running.

## Default (this workspace)

```
Browser client
  TanStack Start + React + Zustand
  Engine in TypeScript (exact enough for the paper's finite claims)
  Canvas 2D / WebGL via rAF
  Optional OffscreenCanvas for orbit / field
  PWA install + export pack
```

This is a valid commercial slice. A geometer with a laptop can use it.
A rig with a 4090 / workstation GPU should feel the same product, faster
on the kernels you actually moved.

## When to take the GPU path

Move a kernel to GPU **only if**:

1. It is dense, batched, and hot (phase Gram, batched SVD, many
   persistences, many null replicates).
2. You can name the API: WebGPU compute, or a documented CUDA/PyTorch
   sidecar the user did not have to start.
3. The CPU path remains correct (preview, mobile, no-GPU laptops).

Do **not** add FastAPI + PyTorch because a blueprint mentioned them.
The preview proxy serves one origin on 8080. A second process you
cannot keep alive is a blank product.

## Suggested kernel split (later, when asked)

| Kernel | Stays on CPU / WASM | Moves to GPU |
| --- | --- | --- |
| Phase map, small Q (≤ 64) | Yes | Optional |
| Dense Φ Gram, Q ≥ 256 | — | WebGPU / CUDA |
| Batched SVD / PCA | — | GPU |
| Persistence on sliding windows | Small N CPU | GPU / specialized |
| Null ensembles (GUE, shuffle) | Few reps CPU | Ray / batched GPU |
| Sheaf coboundary, tiny complexes | Yes | — |
| Real-time drill HUD (10–100ms) | Feature copy | Manifold + PH |

## Honesty badge

The UI may say:

- "Client canvas (rAF)" when that is true.
- "WebGPU kernel" when `navigator.gpu` requested and a shader ran.
- Never "CUDA-ready" because a comment exists.

Provenance records `device: cpu | webgpu | cuda` from what actually ran.

## Precision

GPU floats are not Arb ball arithmetic. Certificates that need enclosures
stay on a decimal / BigFloat path, or they downgrade from **certificate**
to **empirical**. Do not silently drop bits and keep the class.
