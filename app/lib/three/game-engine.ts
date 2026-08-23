import * as THREE from "three";
import { organById, type OrganId } from "../anatomy-data";
import { AnatomyAssetManager, type LoadedOrgan } from "./loaders";

export type WeaponType = "plasma" | "shotgun" | "annihilator";

export type WeaponInfo = {
  id: WeaponType;
  name: string;
  ammoName: string;
  maxAmmo: number;
  damage: number;
  fireRate: number; // in seconds
  ammoPerShot: number;
  color: string;
  description: string;
};

export const WEAPONS: Record<WeaponType, WeaponInfo> = {
  plasma: {
    id: "plasma",
    name: "PLASMA ANTIBODY",
    ammoName: "CELLS",
    maxAmmo: 300,
    damage: 25,
    fireRate: 0.12,
    ammoPerShot: 1,
    color: "#38bdf8",
    description: "Rapid-fire bio-plasma bolts. Excellent against fast virus clusters.",
  },
  shotgun: {
    id: "shotgun",
    name: "BIO-SHOTGUN",
    ammoName: "SHELLS",
    maxAmmo: 60,
    damage: 18, // 8 pellets = 144 max dmg
    fireRate: 0.75,
    ammoPerShot: 1,
    color: "#f97316",
    description: "Heavy spread multi-pellet blast. Devastating at close range against tanky bacteria.",
  },
  annihilator: {
    id: "annihilator",
    name: "NANITE ANNIHILATOR",
    ammoName: "ROCKETS",
    maxAmmo: 30,
    damage: 200,
    fireRate: 1.2,
    ammoPerShot: 1,
    color: "#a855f7",
    description: "Heavy explosive nanite warhead. Massive area-of-effect damage against Leukocyte Necromancers.",
  },
};

export type EnemyType = "virus" | "bacteria" | "necromancer";

export interface Enemy {
  id: string;
  type: EnemyType;
  mesh: THREE.Group;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  radius: number;
  lastAttackTime: number;
  attackCooldown: number;
  shootCooldown: number;
  lastShootTime: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
}

export interface Bullet {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  damage: number;
  radius: number;
  isEnemy: boolean;
  color: string;
  weaponType?: WeaponType;
}

export interface Particle {
  mesh: THREE.Mesh | THREE.Points;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  scaleSpeed: number;
}

export type GameMode = "onboarding" | "real";
export type Difficulty = "easy" | "medium" | "hard";

export interface TargetDummy {
  id: string;
  mesh: THREE.Group;
  hp: number;
  maxHp: number;
  position: THREE.Vector3;
  radius: number;
  isHit: boolean;
}

export const DIFFICULTY_SETTINGS: Record<Difficulty, {
  name: string;
  hpMult: number;
  dmgMult: number;
  speedMult: number;
  organDecayMult: number;
  enemyCountMult: number;
}> = {
  easy: {
    name: "Легкий (Easy)",
    hpMult: 0.6,
    dmgMult: 0.5,
    speedMult: 0.8,
    organDecayMult: 0.5,
    enemyCountMult: 0.75,
  },
  medium: {
    name: "Средний (Medium)",
    hpMult: 1.0,
    dmgMult: 1.0,
    speedMult: 1.0,
    organDecayMult: 1.0,
    enemyCountMult: 1.0,
  },
  hard: {
    name: "Сложный (Hard)",
    hpMult: 1.4,
    dmgMult: 1.5,
    speedMult: 1.25,
    organDecayMult: 1.5,
    enemyCountMult: 1.3,
  },
};

export type GameState = {
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
  ammo: Record<WeaponType, number>;
  activeWeapon: WeaponType;
  organIntegrity: number; // 0 - 100
  score: number;
  kills: number;
  wave: number;
  organId: OrganId;
  isGameOver: boolean;
  isVictory: boolean;
  enemiesRemaining: number;
  isPointerLocked: boolean;
  isFiring: boolean;
  faceExpression: "normal" | "firing" | "hurt" | "critical" | "dead";
  gameMode: GameMode;
  difficulty: Difficulty;
  onboardingStep: number;
  dummiesDestroyed: number;
};

type GameCallbacks = {
  onStateUpdate: (state: GameState) => void;
  onAudioTrigger?: (type: "shoot" | "hit" | "kill" | "player_hurt" | "pickup" | "wave") => void;
};

// Performance optimization: Reusable scratch vectors to avoid per-frame allocations in 60 FPS animation loop
const scratchVecA = new THREE.Vector3();
const scratchVecB = new THREE.Vector3();

// Performance optimization: Shared unit sphere geometry to avoid allocating a new WebGLBuffer
// geometry for every particle, muzzle flash, and bullet fired during gameplay.
const unitSphereGeom = new THREE.SphereGeometry(1, 8, 8);
const lowPolySphereGeom = new THREE.SphereGeometry(1, 6, 6);

// Performance optimization: Material cache for MeshBasicMaterial to avoid allocations during shooting & particle effects
const materialCache = new Map<string, THREE.MeshBasicMaterial>();

function getBasicMaterial(colorStr: string, transparent = false, opacity = 1.0): THREE.MeshBasicMaterial {
  const key = `${colorStr}_${transparent}_${opacity}`;
  let mat = materialCache.get(key);
  if (!mat) {
    mat = new THREE.MeshBasicMaterial({ color: colorStr, transparent, opacity });
    materialCache.set(key, mat);
  }
  return mat;
}

// Simple retro Web Audio API Synthesizer
class SoundSynth {
  private ctx: AudioContext | null = null;

  constructor() {
    // AudioContext created lazily on user interaction
  }

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  play(type: "shoot_plasma" | "shoot_shotgun" | "shoot_annihilator" | "hit" | "kill" | "player_hurt" | "necromancer_summon") {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    try {
      if (type === "shoot_plasma") {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.1);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (type === "shoot_shotgun") {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === "shoot_annihilator") {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(400, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.45);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (type === "hit") {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === "kill") {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.2);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === "player_hurt") {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.linearRampToValueAtTime(50, now + 0.3);
        gain.gain.setValueAtTime(0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch {
      // Audio fallback silent
    }
  }
}

export class DoomGameEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private assets: AnatomyAssetManager;
  private synth = new SoundSynth();

  // Player / Movement
  private playerPos = new THREE.Vector3(0, 0, 7);
  private playerVel = new THREE.Vector3();
  private cameraPitch = 0;
  private cameraYaw = 0;
  private keysPressed: Record<string, boolean> = {};
  private isPointerLocked = false;
  private isMouseDown = false;

  // Touch & Mobile Input State
  private isTouchDevice = false;
  private touchMoveVector = new THREE.Vector2(0, 0); // x: left/right, y: forward/back
  private isTouchFiring = false;
  private isTouchUp = false;
  private isTouchDown = false;
  private lookTouchId: number | null = null;
  private lastTouchPos = new THREE.Vector2();

  // Organ Model
  private organ: LoadedOrgan | null = null;
  private currentOrganId: OrganId = "heart";

  // Game Objects
  private enemies: Enemy[] = [];
  private targetDummies: TargetDummy[] = [];
  private bullets: Bullet[] = [];
  private particles: Particle[] = [];

  // Weapon State
  private activeWeapon: WeaponType = "plasma";
  private lastFireTime = 0;

  // Mode & Difficulty State
  private gameMode: GameMode = "onboarding";
  private difficulty: Difficulty = "medium";
  private onboardingStep = 1;
  private dummiesDestroyed = 0;

  // Game Stats
  private health = 100;
  private armor = 100;
  private ammo: Record<WeaponType, number> = {
    plasma: 300,
    shotgun: 60,
    annihilator: 30,
  };
  private organIntegrity = 100;
  private score = 0;
  private kills = 0;
  private wave = 1;
  private totalWaveEnemies = 8;
  private isGameOver = false;
  private isVictory = false;

  private callbacks: GameCallbacks;
  private clock = new THREE.Clock();
  private animFrameId = 0;
  private hurtFlashTimer = 0;

  constructor(container: HTMLElement, callbacks: GameCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a0510, 0.04);

    this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 100);
    this.camera.position.copy(this.playerPos);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    container.appendChild(this.renderer.domElement);

    this.assets = new AnatomyAssetManager(this.renderer);
    this.setupLighting();

    this.bindEvents();
    this.loadOrgan("heart");
    this.initMode("onboarding");
    this.animate();
  }

  public initMode(mode: GameMode, difficulty: Difficulty = "medium") {
    this.gameMode = mode;
    this.difficulty = difficulty;
    this.isGameOver = false;
    this.isVictory = false;

    if (mode === "onboarding") {
      this.health = 100;
      this.armor = 100;
      this.organIntegrity = 100;
      this.onboardingStep = 1;
      this.dummiesDestroyed = 0;
      this.clearEnemiesAndBullets();
      this.setupOnboardingStep(1);
    } else {
      this.health = 100;
      this.armor = 50;
      this.organIntegrity = 100;
      this.score = 0;
      this.kills = 0;
      this.wave = 1;
      this.ammo = { plasma: 150, shotgun: 30, annihilator: 10 };
      this.playerPos.set(0, 0, 7);
      this.clearEnemiesAndBullets();
      this.startWave(1);
    }
    this.emitState();
  }

  public setDifficulty(difficulty: Difficulty) {
    this.difficulty = difficulty;
    if (this.gameMode === "real") {
      this.restartGame();
    } else {
      this.emitState();
    }
  }

  public setOnboardingStep(step: number) {
    this.onboardingStep = step;
    this.setupOnboardingStep(step);
    this.emitState();
  }

  private setupOnboardingStep(step: number) {
    this.clearEnemiesAndBullets();
    this.health = 100;
    this.armor = 100;
    this.organIntegrity = 100;
    this.ammo = { plasma: 300, shotgun: 60, annihilator: 30 };

    if (step === 1) {
      // Step 1: Controls & 3D Movement
      // Clear targets/enemies, spawn 1 stationary guide target in distance
      this.spawnTargetDummy(new THREE.Vector3(0, 0, -2));
    } else if (step === 2) {
      // Step 2: Target Practice (3 Shooting Dummies)
      this.spawnTargetDummy(new THREE.Vector3(-3, 0.5, 0));
      this.spawnTargetDummy(new THREE.Vector3(0, 1, -2));
      this.spawnTargetDummy(new THREE.Vector3(3, 0.5, 0));
    } else if (step === 3) {
      // Step 3: Enemy Overview Showcase (1 Virus, 1 Bacteria, 1 Necromancer in safe positions)
      this.spawnEnemy("virus", new THREE.Vector3(-4, 0, 1), true);
      this.spawnEnemy("bacteria", new THREE.Vector3(0, 0, -1), true);
      this.spawnEnemy("necromancer", new THREE.Vector3(4, 0, 1), true);
    } else if (step === 4) {
      // Step 4: Defense & Organ Integrity Showcase
      this.spawnTargetDummy(new THREE.Vector3(-2, 0, 0));
      this.spawnTargetDummy(new THREE.Vector3(2, 0, 0));
      this.spawnEnemy("virus", new THREE.Vector3(-3, 0, 2), true);
      this.spawnEnemy("bacteria", new THREE.Vector3(3, 0, 2), true);
    } else if (step === 5) {
      // Step 5: Final Practice Field
      this.spawnTargetDummy(new THREE.Vector3(-3, 1, 0));
      this.spawnTargetDummy(new THREE.Vector3(0, 1.5, -2));
      this.spawnTargetDummy(new THREE.Vector3(3, 1, 0));
      this.spawnEnemy("virus", new THREE.Vector3(-2, 0, 3), true);
      this.spawnEnemy("bacteria", new THREE.Vector3(2, 0, 3), true);
    }
  }

  private spawnTargetDummy(pos: THREE.Vector3) {
    const group = new THREE.Group();

    // Target outer ring
    const ringGeom = new THREE.TorusGeometry(0.6, 0.08, 16, 32);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.5 });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    group.add(ring);

    // Inner bullseye sphere
    const innerGeom = new THREE.SphereGeometry(0.3, 16, 16);
    const innerMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0x991b1b, emissiveIntensity: 0.6 });
    const inner = new THREE.Mesh(innerGeom, innerMat);
    group.add(inner);

    // Glow point light
    const light = new THREE.PointLight(0x38bdf8, 1, 3);
    group.add(light);

    group.position.copy(pos);
    this.scene.add(group);

    this.targetDummies.push({
      id: Math.random().toString(36).substring(2, 9),
      mesh: group,
      hp: 100,
      maxHp: 100,
      position: group.position,
      radius: 0.6,
      isHit: false,
    });
  }

  private setupLighting() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    const dirLight = new THREE.DirectionalLight(0xff3366, 2.5);
    dirLight.position.set(5, 10, 7);
    this.scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x3388ff, 2.0);
    rimLight.position.set(-5, -5, -5);
    this.scene.add(rimLight);

    // Dynamic player light
    const playerLight = new THREE.PointLight(0x38bdf8, 1.5, 15);
    playerLight.name = "playerLight";
    this.scene.add(playerLight);
  }

  public bindEvents() {
    const canvas = this.renderer.domElement;

    canvas.addEventListener("click", () => {
      if (!this.isPointerLocked && !this.isGameOver && !this.isTouchDevice) {
        canvas.requestPointerLock();
      }
    });

    document.addEventListener("pointerlockchange", () => {
      this.isPointerLocked = document.pointerLockElement === canvas;
      this.emitState();
    });

    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("mousedown", this.onMouseDown);
    window.addEventListener("mouseup", this.onMouseUp);
    window.addEventListener("resize", this.onResize);

    // Canvas Touch Look Listeners
    canvas.addEventListener("touchstart", this.onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", this.onTouchMove, { passive: false });
    canvas.addEventListener("touchend", this.onTouchEnd, { passive: false });
    canvas.addEventListener("touchcancel", this.onTouchEnd, { passive: false });
  }

  private onKeyDown = (e: KeyboardEvent) => {
    this.keysPressed[e.code] = true;
    if (e.code === "Digit1") this.setWeapon("plasma");
    if (e.code === "Digit2") this.setWeapon("shotgun");
    if (e.code === "Digit3") this.setWeapon("annihilator");
    if (e.code === "KeyR" && (this.isGameOver || this.isVictory)) {
      this.restartGame();
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keysPressed[e.code] = false;
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.isPointerLocked && !this.isTouchDevice) return;
    const sensitivity = 0.0022;
    this.rotateCamera(e.movementX * sensitivity, e.movementY * sensitivity);
  };

  public rotateCamera(dxSensitivity: number, dySensitivity: number) {
    this.cameraYaw -= dxSensitivity;
    this.cameraPitch -= dySensitivity;
    // Clamp pitch
    this.cameraPitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.cameraPitch));
  }

  public setTouchMoveVector(x: number, y: number) {
    this.isTouchDevice = true;
    this.touchMoveVector.set(x, y);
  }

  public setTouchFiring(firing: boolean) {
    this.isTouchDevice = true;
    this.isTouchFiring = firing;
  }

  public setTouchUpDown(up: boolean, down: boolean) {
    this.isTouchDevice = true;
    this.isTouchUp = up;
    this.isTouchDown = down;
  }

  public markTouchDevice() {
    this.isTouchDevice = true;
  }

  private onTouchStart = (e: TouchEvent) => {
    this.isTouchDevice = true;
    if (this.lookTouchId !== null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      // Assign look touch if on right half of canvas or general canvas area
      this.lookTouchId = touch.identifier;
      this.lastTouchPos.set(touch.clientX, touch.clientY);
      break;
    }
  };

  private onTouchMove = (e: TouchEvent) => {
    if (this.lookTouchId === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === this.lookTouchId) {
        const dx = touch.clientX - this.lastTouchPos.x;
        const dy = touch.clientY - this.lastTouchPos.y;
        this.rotateCamera(dx * 0.004, dy * 0.004);
        this.lastTouchPos.set(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  private onTouchEnd = (e: TouchEvent) => {
    if (this.lookTouchId === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === this.lookTouchId) {
        this.lookTouchId = null;
        break;
      }
    }
  };

  private onMouseDown = (e: MouseEvent) => {
    if (e.button === 0) {
      this.isMouseDown = true;
      if (this.isPointerLocked) {
        this.tryFireWeapon();
      }
    }
  };

  private onMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      this.isMouseDown = false;
    }
  };

  private onResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public async loadOrgan(organId: OrganId) {
    this.currentOrganId = organId;
    const organData = organById[organId];
    if (!organData) return;

    if (this.organ) {
      this.scene.remove(this.organ.pivot);
      this.assets.release(this.organ);
      this.organ = null;
    }

    try {
      this.organ = await this.assets.load(organData.model, () => {});
      this.organ.pivot.position.set(0, 0, 0);
      this.organ.pivot.scale.setScalar(1.8);
      this.scene.add(this.organ.pivot);
    } catch {
      // Fallback mesh if model load fails
      const geom = new THREE.SphereGeometry(1.8, 32, 32);
      const mat = new THREE.MeshStandardMaterial({ color: organData.accent, roughness: 0.3 });
      const mesh = new THREE.Mesh(geom, mat);
      const group = new THREE.Group();
      group.add(mesh);
      this.organ = { url: organData.model, pivot: group, meshes: [mesh], mixer: null };
      this.scene.add(group);
    }
  }

  public setWeapon(type: WeaponType) {
    this.activeWeapon = type;
    this.emitState();
  }

  public changeOrganLevel(organId: OrganId) {
    this.loadOrgan(organId);
    this.wave = 1;
    this.organIntegrity = 100;
    this.clearEnemiesAndBullets();
    this.startWave(1);
    this.emitState();
  }

  private clearEnemiesAndBullets() {
    this.enemies.forEach((e) => this.scene.remove(e.mesh));
    this.enemies = [];
    this.targetDummies.forEach((d) => this.scene.remove(d.mesh));
    this.targetDummies = [];
    this.bullets.forEach((b) => this.scene.remove(b.mesh));
    this.bullets = [];
    this.particles.forEach((p) => this.scene.remove(p.mesh));
    this.particles = [];
  }

  public restartGame() {
    if (this.gameMode === "onboarding") {
      this.initMode("onboarding");
      return;
    }
    this.health = 100;
    this.armor = 50;
    this.organIntegrity = 100;
    this.score = 0;
    this.kills = 0;
    this.wave = 1;
    this.isGameOver = false;
    this.isVictory = false;
    this.ammo = { plasma: 150, shotgun: 30, annihilator: 10 };
    this.playerPos.set(0, 0, 7);
    this.clearEnemiesAndBullets();
    this.startWave(1);
    this.emitState();
  }

  private startWave(waveNum: number) {
    this.wave = waveNum;
    const diff = DIFFICULTY_SETTINGS[this.difficulty];
    this.totalWaveEnemies = Math.round((6 + waveNum * 4) * diff.enemyCountMult);
    this.spawnWaveEnemies();
  }

  private spawnWaveEnemies() {
    const numEnemies = this.totalWaveEnemies;
    for (let i = 0; i < numEnemies; i++) {
      let type: EnemyType = "virus";
      const rand = Math.random();
      if (rand < 0.5) {
        type = "virus";
      } else if (rand < 0.82) {
        type = "bacteria";
      } else {
        type = "necromancer";
      }

      this.spawnEnemy(type);
    }
  }

  private spawnEnemy(type: EnemyType, spawnPos?: THREE.Vector3, isPassive: boolean = false) {
    const group = new THREE.Group();
    const diff = DIFFICULTY_SETTINGS[this.difficulty];

    let color = 0x22c55e;
    let size = 0.35;
    let hp = 40;
    let speed = 2.8;
    let damage = 10;

    if (type === "virus") {
      // Virus: Spiky Icosahedron
      color = 0xef4444; // Red spike virus
      size = 0.35;
      hp = 22.5 * diff.hpMult; // 50% HP reduction (formerly 45)
      speed = 3.2 * diff.speedMult;
      damage = 8 * diff.dmgMult;

      const geom = new THREE.IcosahedronGeometry(size, 1);
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.2, metalness: 0.8, emissive: 0x990000, emissiveIntensity: 0.4 });
      const core = new THREE.Mesh(geom, mat);
      group.add(core);

      // Add spikes
      for (let s = 0; s < 12; s++) {
        const spikeGeom = new THREE.ConeGeometry(0.08, 0.4, 4);
        const spikeMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
        const spike = new THREE.Mesh(spikeGeom, spikeMat);
        const dir = new THREE.Vector3((Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2).normalize();
        spike.position.copy(dir.clone().multiplyScalar(size));
        spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
        group.add(spike);
      }
    } else if (type === "bacteria") {
      // Bacteria: Capsule/Rod shape
      color = 0xeab308; // Yellow toxic rod
      size = 0.55;
      hp = 60 * diff.hpMult; // 50% HP reduction (formerly 120)
      speed = 1.6 * diff.speedMult;
      damage = 18 * diff.dmgMult;

      const geom = new THREE.CapsuleGeometry(size * 0.6, size * 1.2, 8, 16);
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, emissive: 0x665500, emissiveIntensity: 0.3 });
      const mesh = new THREE.Mesh(geom, mat);
      group.add(mesh);

      // Toxic glow light
      const light = new THREE.PointLight(0xeab308, 1, 3);
      group.add(light);
    } else if (type === "necromancer") {
      // Infected Leukocyte Necromancer
      color = 0xa855f7; // Corrupted Purple Leukocyte
      size = 0.85;
      hp = 140 * diff.hpMult; // 50% HP reduction (formerly 280)
      speed = 1.2 * diff.speedMult;
      damage = 25 * diff.dmgMult;

      const geom = new THREE.DodecahedronGeometry(size, 2);
      const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.1, wireframe: false, emissive: 0x581c87, emissiveIntensity: 0.6 });
      const mesh = new THREE.Mesh(geom, mat);
      group.add(mesh);

      // Dark aura sphere
      const auraGeom = new THREE.SphereGeometry(size * 1.3, 16, 16);
      const auraMat = new THREE.MeshBasicMaterial({ color: 0xc084fc, wireframe: true, transparent: true, opacity: 0.3 });
      const aura = new THREE.Mesh(auraGeom, auraMat);
      group.add(aura);

      const light = new THREE.PointLight(0xa855f7, 2, 5);
      group.add(light);
    }

    // Spawn position: random point around player
    let pos = spawnPos;
    if (!pos) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 6 + Math.random() * 8;
      const height = (Math.random() - 0.5) * 4;
      pos = new THREE.Vector3(this.playerPos.x + Math.cos(angle) * dist, height, this.playerPos.z + Math.sin(angle) * dist);
    }

    group.position.copy(pos);
    this.scene.add(group);

    const enemy: Enemy = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      mesh: group,
      hp,
      maxHp: hp,
      speed: isPassive ? 0 : speed,
      damage: isPassive ? 0 : damage,
      radius: size,
      lastAttackTime: 0,
      attackCooldown: 1.0,
      shootCooldown: isPassive ? 99999 : type === "bacteria" ? 2.5 : type === "necromancer" ? 3.5 : 999,
      lastShootTime: performance.now(),
      position: group.position,
      velocity: new THREE.Vector3(),
    };

    this.enemies.push(enemy);
  }

  private tryFireWeapon() {
    const now = performance.now() / 1000;
    const info = WEAPONS[this.activeWeapon];

    if (now - this.lastFireTime < info.fireRate) return;

    if (this.gameMode === "onboarding") {
      // Onboarding: Infinite / auto-replenishing ammo
      this.ammo[this.activeWeapon] = info.maxAmmo;
    } else if (this.ammo[this.activeWeapon] < info.ammoPerShot) {
      return; // Out of ammo
    }

    this.ammo[this.activeWeapon] -= info.ammoPerShot;
    this.lastFireTime = now;

    // Play weapon SFX
    if (this.activeWeapon === "plasma") this.synth.play("shoot_plasma");
    else if (this.activeWeapon === "shotgun") this.synth.play("shoot_shotgun");
    else if (this.activeWeapon === "annihilator") this.synth.play("shoot_annihilator");

    // Spawn Bullets
    const shootDir = new THREE.Vector3(0, 0, -1);
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationFromEuler(new THREE.Euler(this.cameraPitch, this.cameraYaw, 0, "YXZ"));
    shootDir.applyMatrix4(rotationMatrix).normalize();

    // Calculate muzzle position using scratch vector to avoid clone allocation
    const muzzlePos = scratchVecA.copy(shootDir).multiplyScalar(0.4).add(this.playerPos);

    if (this.activeWeapon === "plasma") {
      this.createBullet(muzzlePos, shootDir, 28, info.damage, 0.12, false, info.color, "plasma");
    } else if (this.activeWeapon === "shotgun") {
      // Shotgun pellet spread (8 pellets)
      for (let i = 0; i < 8; i++) {
        const spreadDir = scratchVecB.copy(shootDir).add(new THREE.Vector3((Math.random() - 0.5) * 0.18, (Math.random() - 0.5) * 0.18, (Math.random() - 0.5) * 0.18)).normalize();
        this.createBullet(muzzlePos, spreadDir, 24, info.damage, 0.08, false, info.color, "shotgun");
      }
    } else if (this.activeWeapon === "annihilator") {
      this.createBullet(muzzlePos, shootDir, 18, info.damage, 0.35, false, info.color, "annihilator");
    }

    this.createMuzzleFlash(muzzlePos, info.color);
    this.emitState();
  }

  private createBullet(pos: THREE.Vector3, dir: THREE.Vector3, speed: number, damage: number, radius: number, isEnemy: boolean, colorStr: string, weaponType?: WeaponType) {
    // Re-use shared unitSphereGeom and materialCache to prevent memory allocation on every bullet fired
    const mat = getBasicMaterial(colorStr);
    const mesh = new THREE.Mesh(unitSphereGeom, mat);
    mesh.scale.setScalar(radius);
    mesh.position.copy(pos);
    this.scene.add(mesh);

    this.bullets.push({
      mesh,
      position: mesh.position,
      velocity: dir.clone().multiplyScalar(speed),
      life: 2.2,
      damage,
      radius,
      isEnemy,
      color: colorStr,
      weaponType,
    });
  }

  private createMuzzleFlash(pos: THREE.Vector3, colorStr: string) {
    // Re-use shared unitSphereGeom and materialCache for instant muzzle flash creation without allocations
    const mat = getBasicMaterial(colorStr, true, 0.9);
    const mesh = new THREE.Mesh(unitSphereGeom, mat);
    mesh.scale.setScalar(0.2);
    mesh.position.copy(pos);
    this.scene.add(mesh);

    this.particles.push({
      mesh,
      velocity: new THREE.Vector3(),
      life: 0.05,
      maxLife: 0.05,
      scaleSpeed: -3.0,
    });
  }

  private createExplosion(pos: THREE.Vector3, colorStr: string, count = 16) {
    const mat = getBasicMaterial(colorStr);
    for (let i = 0; i < count; i++) {
      // Re-use lowPolySphereGeom and materialCache to eliminate dozens of geometry/material allocations per explosion
      const mesh = new THREE.Mesh(lowPolySphereGeom, mat);
      mesh.scale.setScalar(0.06 + Math.random() * 0.08);
      mesh.position.copy(pos);
      this.scene.add(mesh);

      const vel = new THREE.Vector3((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);

      this.particles.push({
        mesh,
        velocity: vel,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7,
        scaleSpeed: -1.2,
      });
    }
  }

  // Core Game Loop
  private animate = () => {
    this.animFrameId = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.08);

    if (!this.isGameOver) {
      this.updatePlayerMovement(delta);
      if ((this.isMouseDown && this.isPointerLocked) || this.isTouchFiring) {
        this.tryFireWeapon();
      }
      this.updateEnemies(delta);
      this.updateBullets(delta);
      this.updateParticles(delta);

      // Rotate Organ slowly
      if (this.organ) {
        this.organ.pivot.rotation.y += delta * 0.2;
      }
    }

    this.renderer.render(this.scene, this.camera);
  };

  private updatePlayerMovement(delta: number) {
    if (!this.isPointerLocked && !this.isTouchDevice) return;

    const speed = 6.5;
    // Reuse scratch vector to avoid per-frame vector instantiation
    const moveDir = scratchVecB.set(0, 0, 0);

    if (this.keysPressed["KeyW"]) moveDir.z -= 1;
    if (this.keysPressed["KeyS"]) moveDir.z += 1;
    if (this.keysPressed["KeyA"]) moveDir.x -= 1;
    if (this.keysPressed["KeyD"]) moveDir.x += 1;

    // Apply Touch Joystick
    if (this.touchMoveVector.lengthSq() > 0.01) {
      moveDir.x += this.touchMoveVector.x;
      moveDir.z += this.touchMoveVector.y;
    }

    if (this.keysPressed["Space"] || this.isTouchUp) moveDir.y += 0.8;
    if (this.keysPressed["ShiftLeft"] || this.isTouchDown) moveDir.y -= 0.8;

    moveDir.normalize();

    // Rotate moveDir according to camera yaw
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationY(this.cameraYaw);
    moveDir.applyMatrix4(rotationMatrix);

    this.playerVel.copy(moveDir.multiplyScalar(speed * delta));
    this.playerPos.add(this.playerVel);

    // Keep player within arena bounds
    this.playerPos.x = THREE.MathUtils.clamp(this.playerPos.x, -14, 14);
    this.playerPos.y = THREE.MathUtils.clamp(this.playerPos.y, -6, 8);
    this.playerPos.z = THREE.MathUtils.clamp(this.playerPos.z, -14, 14);

    // Update Camera Transform
    this.camera.position.copy(this.playerPos);
    this.camera.quaternion.setFromEuler(new THREE.Euler(this.cameraPitch, this.cameraYaw, 0, "YXZ"));

    // Update Player Dynamic Light
    const playerLight = this.scene.getObjectByName("playerLight") as THREE.PointLight;
    if (playerLight) playerLight.position.copy(this.playerPos);
  }

  private updateEnemies(delta: number) {
    const now = performance.now();

    // Rotate Target Dummies
    for (let d = 0; d < this.targetDummies.length; d++) {
      const dummy = this.targetDummies[d];
      dummy.mesh.rotation.y += delta * 2.0;
      dummy.mesh.position.y += Math.sin(now * 0.003 + d) * 0.003;
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];

      if (e.speed > 0) {
        // Move enemy towards player or organ without per-frame vector allocations
        scratchVecA.copy(this.playerPos).sub(e.position).normalize();

        e.position.add(scratchVecA.multiplyScalar(e.speed * delta));
        e.mesh.position.copy(e.position);
      }
      e.mesh.rotation.y += delta * 1.5;

      const distToPlayer = e.position.distanceTo(this.playerPos);

      if (this.gameMode !== "onboarding") {
        // Melee attack
        if (distToPlayer < e.radius + 0.6) {
          if (now - e.lastAttackTime > e.attackCooldown * 1000) {
            this.damagePlayer(e.damage);
            e.lastAttackTime = now;
          }
        }

        // Ranged attacks for Bacteria & Necromancer
        if (e.type === "bacteria" && distToPlayer < 12) {
          if (now - e.lastShootTime > e.shootCooldown * 1000) {
            e.lastShootTime = now;
            scratchVecA.copy(this.playerPos).sub(e.position).normalize();
            this.createBullet(e.position, scratchVecA, 10, 12, 0.2, true, "#eab308");
          }
        } else if (e.type === "necromancer") {
          if (now - e.lastShootTime > e.shootCooldown * 1000) {
            e.lastShootTime = now;
            this.synth.play("necromancer_summon");
            if (this.enemies.length < 20) {
              scratchVecB.copy(e.position).add(new THREE.Vector3(1, 0, 1));
              this.spawnEnemy("virus", scratchVecB);
            }
            scratchVecA.copy(this.playerPos).sub(e.position).normalize();
            this.createBullet(e.position, scratchVecA, 12, 20, 0.3, true, "#a855f7");
          }
        }

        // Organ Damage: Enemies close to center slowly damage organ (using lengthSq for speed)
        if (e.position.lengthSq() < 6.25) {
          const decayMult = DIFFICULTY_SETTINGS[this.difficulty].organDecayMult;
          this.organIntegrity = Math.max(0, this.organIntegrity - delta * 1.5 * decayMult);
          if (this.organIntegrity <= 0 && !this.isGameOver) {
            this.triggerGameOver(false);
          }
        }
      }
    }
  }

  private updateBullets(delta: number) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      // Reuse scratch vector to eliminate per-bullet vector allocations on every frame
      scratchVecA.copy(b.velocity).multiplyScalar(delta);
      b.position.add(scratchVecA);
      b.mesh.position.copy(b.position);
      b.life -= delta;

      if (b.life <= 0) {
        this.scene.remove(b.mesh);
        this.bullets.splice(i, 1);
        continue;
      }

      if (b.isEnemy) {
        // Enemy bullet hitting player (using distanceToSquared to avoid Math.sqrt)
        const hitRadius = b.radius + 0.5;
        if (b.position.distanceToSquared(this.playerPos) < hitRadius * hitRadius) {
          this.damagePlayer(b.damage);
          this.createExplosion(b.position, b.color, 6);
          this.scene.remove(b.mesh);
          this.bullets.splice(i, 1);
          continue;
        }
      } else {
        // Player bullet hitting target dummies (using distanceToSquared to avoid Math.sqrt)
        let hitDummy = false;
        for (let d = this.targetDummies.length - 1; d >= 0; d--) {
          const dummy = this.targetDummies[d];
          const hitRadius = b.radius + dummy.radius;
          if (b.position.distanceToSquared(dummy.position) < hitRadius * hitRadius) {
            dummy.hp -= b.damage;
            this.synth.play("hit");
            this.createExplosion(b.position, "#38bdf8", 12);
            hitDummy = true;

            if (dummy.hp <= 0) {
              this.synth.play("kill");
              this.createExplosion(dummy.position, "#38bdf8", 24);
              this.scene.remove(dummy.mesh);
              this.targetDummies.splice(d, 1);
              this.dummiesDestroyed++;
              // Respawn dummy if in onboarding
              if (this.gameMode === "onboarding") {
                const dummyPos = dummy.position.clone();
                setTimeout(() => {
                  if (this.gameMode === "onboarding") {
                    this.spawnTargetDummy(dummyPos);
                  }
                }, 1500);
              }
            }
            break;
          }
        }

        if (hitDummy) {
          this.scene.remove(b.mesh);
          this.bullets.splice(i, 1);
          this.emitState();
          continue;
        }

        // Player bullet hitting enemies (using distanceToSquared to avoid Math.sqrt)
        let hitEnemy = false;
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const e = this.enemies[j];
          const hitRadius = b.radius + e.radius;
          if (b.position.distanceToSquared(e.position) < hitRadius * hitRadius) {
            e.hp -= b.damage;
            this.synth.play("hit");
            this.createExplosion(b.position, b.color, b.weaponType === "annihilator" ? 24 : 8);

            // Annihilator Splash Damage (4.0 * 4.0 = 16.0)
            if (b.weaponType === "annihilator") {
              this.enemies.forEach((otherE) => {
                if (otherE.position.distanceToSquared(b.position) < 16.0) {
                  otherE.hp -= 100;
                }
              });
            }

            hitEnemy = true;

            // Check Enemy Death
            if (e.hp <= 0) {
              this.synth.play("kill");
              this.createExplosion(e.position, "#ff0055", 20);
              this.scene.remove(e.mesh);
              this.enemies.splice(j, 1);

              this.score += e.type === "virus" ? 100 : e.type === "bacteria" ? 250 : 600;
              this.kills++;

              // Onboarding respawn passive showcase enemy
              if (this.gameMode === "onboarding") {
                const respawnType = e.type;
                const respawnPos = e.position.clone();
                setTimeout(() => {
                  if (this.gameMode === "onboarding") {
                    this.spawnEnemy(respawnType, respawnPos, true);
                  }
                }, 2000);
              } else {
                // Chance to drop ammo or armor
                if (Math.random() < 0.3) {
                  this.ammo[this.activeWeapon] = Math.min(
                    WEAPONS[this.activeWeapon].maxAmmo,
                    this.ammo[this.activeWeapon] + (this.activeWeapon === "plasma" ? 30 : this.activeWeapon === "shotgun" ? 8 : 3)
                  );
                }
              }
            }
            break;
          }
        }

        if (hitEnemy) {
          this.scene.remove(b.mesh);
          this.bullets.splice(i, 1);
          if (this.gameMode === "real") {
            this.checkWaveProgress();
          } else {
            this.emitState();
          }
          continue;
        }
      }
    }
  }

  private checkWaveProgress() {
    if (this.enemies.length === 0 && !this.isGameOver) {
      if (this.wave < 5) {
        this.startWave(this.wave + 1);
      } else {
        this.triggerGameOver(true);
      }
    }
    this.emitState();
  }

  private damagePlayer(amount: number) {
    if (this.isGameOver) return;

    // In onboarding mode, player cannot die ("где не убивают")
    if (this.gameMode === "onboarding") {
      this.health = 100;
      this.armor = 100;
      this.emitState();
      return;
    }

    this.synth.play("player_hurt");
    this.hurtFlashTimer = 0.3;

    if (this.armor > 0) {
      const armorAbsorb = Math.min(this.armor, amount * 0.6);
      this.armor -= armorAbsorb;
      amount -= armorAbsorb;
    }

    this.health -= amount;

    if (this.health <= 0) {
      this.health = 0;
      this.triggerGameOver(false);
    }

    this.emitState();
  }

  private triggerGameOver(victory: boolean) {
    this.isGameOver = true;
    this.isVictory = victory;
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
    this.emitState();
  }

  private updateParticles(delta: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      // Reuse scratch vector to eliminate per-particle vector allocations on every frame
      scratchVecA.copy(p.velocity).multiplyScalar(delta);
      p.mesh.position.add(scratchVecA);
      p.life -= delta;

      if (p.scaleSpeed) {
        const currentScale = p.mesh.scale.x;
        const newScale = Math.max(0.01, currentScale + p.scaleSpeed * delta);
        p.mesh.scale.setScalar(newScale);
      }

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }
  }

  private emitState() {
    let expression: GameState["faceExpression"] = "normal";
    if (this.health <= 0) expression = "dead";
    else if (this.health < 30) expression = "critical";
    else if (this.hurtFlashTimer > 0) expression = "hurt";
    else if (this.isMouseDown) expression = "firing";

    this.callbacks.onStateUpdate({
      health: Math.round(this.health),
      maxHealth: 100,
      armor: Math.round(this.armor),
      maxArmor: 100,
      ammo: { ...this.ammo },
      activeWeapon: this.activeWeapon,
      organIntegrity: Math.round(this.organIntegrity),
      score: this.score,
      kills: this.kills,
      wave: this.wave,
      organId: this.currentOrganId,
      isGameOver: this.isGameOver,
      isVictory: this.isVictory,
      enemiesRemaining: this.enemies.length,
      isPointerLocked: this.isPointerLocked,
      isFiring: this.isMouseDown,
      faceExpression: expression,
      gameMode: this.gameMode,
      difficulty: this.difficulty,
      onboardingStep: this.onboardingStep,
      dummiesDestroyed: this.dummiesDestroyed,
    });
  }

  public dispose() {
    cancelAnimationFrame(this.animFrameId);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("mousedown", this.onMouseDown);
    window.removeEventListener("mouseup", this.onMouseUp);
    window.removeEventListener("resize", this.onResize);

    const canvas = this.renderer?.domElement;
    if (canvas) {
      canvas.removeEventListener("touchstart", this.onTouchStart);
      canvas.removeEventListener("touchmove", this.onTouchMove);
      canvas.removeEventListener("touchend", this.onTouchEnd);
      canvas.removeEventListener("touchcancel", this.onTouchEnd);
    }

    this.clearEnemiesAndBullets();
    this.assets.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
