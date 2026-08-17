## 2025-05-20 - Three.js Game Loop Scratch Vector Optimization
**Learning:** Instantiating `THREE.Vector3`, `THREE.Matrix4`, and `THREE.Euler` inside 60 FPS update loops (`updateBullets`, `updateEnemies`, `updateParticles`, `updatePlayerMovement`) causes thousands of object allocations per second, leading to Garbage Collection pauses and micro-stuttering.
**Action:** Always pre-allocate module/scope level scratch objects (`_tempVec3`, `_tempMat4`, `_tempEuler`) for intermediate vector calculations in Three.js animation loops.
