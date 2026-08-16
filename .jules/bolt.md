## 2025-05-18 - Avoid Vector Allocations in 60 FPS Game Loop
**Learning:** In Three.js games, calling `.clone()` or allocating `new THREE.Vector3()` per particle/bullet every frame triggers frequent Garbage Collection spikes and micro-stutters during high-intensity gameplay.
**Action:** Use reusable scratch vectors (`scratchVec`) for vector math inside frame update loops (`updateBullets`, `updateParticles`, `updateEnemies`).
