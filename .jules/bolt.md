## 2025-05-18 - Avoid Vector Allocations in 60 FPS Game Loop
**Learning:** In Three.js games, calling `.clone()` or allocating `new THREE.Vector3()` per particle/bullet every frame triggers frequent Garbage Collection spikes and micro-stutters during high-intensity gameplay.
**Action:** Use reusable scratch vectors (`scratchVec`) for vector math inside frame update loops (`updateBullets`, `updateParticles`, `updateEnemies`).

## 2025-05-19 - Pre-allocate Candidates in Mesh Geometry Processing
**Learning:** In Three.js geometry processing loops (like hotspot surface snapping across 100,000+ vertices), instantiating candidate objects or cloning vectors inside nested loops creates thousands of heap allocations and GC spikes during organ loading.
**Action:** Pre-allocate candidate tier structures with pre-instantiated `Vector3` instances and pre-compute reciprocal scalars (like `invRadius`) before looping over buffer attributes.

## 2025-05-20 - Use `distanceToSquared()` for Collision Checks in 60 FPS Loop
**Learning:** In Three.js game loops with N bullets and M enemies, calling `.distanceTo()` or `.length()` executes hundreds of `Math.sqrt()` operations every frame, creating unnecessary CPU work on the main thread.
**Action:** Use `.distanceToSquared()` and `.lengthSq()` compared against pre-squared distance thresholds (e.g. `sumRadius * sumRadius`) to eliminate square root calculations in collision loops.
