## 2025-05-18 - Avoid Vector Allocations in 60 FPS Game Loop
**Learning:** In Three.js games, calling `.clone()` or allocating `new THREE.Vector3()` per particle/bullet every frame triggers frequent Garbage Collection spikes and micro-stutters during high-intensity gameplay.
**Action:** Use reusable scratch vectors (`scratchVec`) for vector math inside frame update loops (`updateBullets`, `updateParticles`, `updateEnemies`).

## 2025-05-19 - Pre-allocate Candidates in Mesh Geometry Processing
**Learning:** In Three.js geometry processing loops (like hotspot surface snapping across 100,000+ vertices), instantiating candidate objects or cloning vectors inside nested loops creates thousands of heap allocations and GC spikes during organ loading.
**Action:** Pre-allocate candidate tier structures with pre-instantiated `Vector3` instances and pre-compute reciprocal scalars (like `invRadius`) before looping over buffer attributes.

## 2025-05-20 - Cache Materials and Reuse Scratch Transforms in 60 FPS Shooter Loops
**Learning:** In Three.js rapid-fire gameplay loops (e.g. multi-pellet shotguns and particle explosions), allocating `new THREE.MeshBasicMaterial`, `Euler`, or `Matrix4` per fired bullet/particle creates hundreds of heap allocations per second and material churn.
**Action:** Use a material lookup cache (`getBasicMaterial`) and module-scoped scratch transforms (`scratchEuler`, `scratchMatrix`) for high-frequency game loop operations, firing, and particle effects.
