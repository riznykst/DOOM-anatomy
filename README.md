# DOOM: BIO-DEFENDER 3D — System Infection Lockdown

An immersive retro 3D FPS bio-shooter built with **Next.js / Vinext**, **Three.js**, **React 19**, and **Web Audio API**.

---

## 🎮 Overview

**DOOM: BIO-DEFENDER 3D** transforms a 3D medical anatomy viewer into a fast-paced 90s retro action FPS shooter. Take control of an elite nano-drone or bio-immunocyte entering 9 distinct human organ systems to purge aggressive viral infections, toxic bacterial rods, and corrupted white blood cell necromancers before total organ collapse occurs.

---

## 🏰 Legacy Architecture & Origin

Originally founded as an anatomical educational showcase (*Anatomy Atelier*), the codebase provided a high-precision 3D WebGL renderer and 9 high-quality GLTF/GLB organ models.

### Legacy Transition Matrix

| Legacy Component | Original Role | Transformed Retro Bio-Shooter Role |
| :--- | :--- | :--- |
| `app/lib/three/viewer.ts` | Static OrbitControls specimen viewer | Legacy asset loader foundation & lighting environment |
| `app/lib/three/loaders.ts` | GLTF/GLB 3D Model Manager | Dynamic organ 3D arena model asset manager |
| `app/lib/anatomy-data.ts` | Medical organ data & hotspots | Organ levels, 3D coordinate target anchors & system stats |
| `app/lib/three/game-engine.ts` | *NEW Core Game Engine* | FPS Camera movement (WASD + Pointer Lock), bullet physics, Web Audio synthesizer, enemy AI |
| `app/components/DoomBioShooter.tsx` | *NEW React UI & HUD* | Classic Doom bottom HUD, face portrait, health/armor meters, weapon selection, organ level selector |

---

## 🔫 Game Features & Weapons

### 3 Distinct Weapon Systems

1. **Plasma Antibody Gun** (`Key 1`):
   * Rapid-fire bio-plasma bolts. Excellent for clearing fast-moving virus clusters.
2. **Bio-Shotgun** (`Key 2`):
   * Heavy 8-pellet spread blast. Devastating at close range against tanky bacterial rods.
3. **Nanite Annihilator** (`Key 3`):
   * High-explosive heavy nanite warhead with massive area-of-effect splash damage against corrupted bosses.

---

## 👾 Enemy Bestiary

1. **Virus (Melee Rusher)**:
   * Fast, red spiky icosahedron that swarms the player or organ center in groups.
2. **Bacteria (Ranged Toxic Spitter)**:
   * Tanky yellow capsule/rod shape that shoots toxic projectiles from a distance.
3. **Infected Leukocyte Necromancer (Boss / Summoner)**:
   * Corrupted purple white blood cell surrounded by a dark aura. Summons minion viruses and fires heavy corruption energy orbs.

---

## 🕹️ Controls

* **WASD / Space / Shift**: 3D Drone Movement (Forward, Left, Back, Right, Ascend, Descend)
* **Mouse Aim + Left Click**: Fire active weapon (Requires Pointer Lock)
* **Keys 1, 2, 3**: Switch Weapons (Plasma, Shotgun, Annihilator)
* **Key R**: Quick restart level upon victory or defeat

---

## 🚀 Quick Start & Local Development

### Prerequisites
- Node.js `>=22.13.0`
- npm `>=10.0.0`

```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Run test suite
npm test

# Build production bundle
npm run build
```

---

## ☁️ Deployment on Netlify

1. Connect your GitHub / GitLab repository to **Netlify**.
2. Configure build settings:
   * **Branch**: `main`
   * **Build Command**: `npm run build`
   * **Publish Directory**: `.next`
3. Click **Deploy**. Netlify will automatically trigger a build whenever changes are pushed to `main`.
