"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Crosshair,
  Heart,
  RotateCcw,
  Shield,
  Skull,
  Zap,
} from "lucide-react";
import { organById, organs, type OrganId } from "../lib/anatomy-data";
import {
  DoomGameEngine,
  WEAPONS,
  type GameState,
  type WeaponType,
} from "../lib/three/game-engine";

export function DoomBioShooter() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<DoomGameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>({
    health: 100,
    maxHealth: 100,
    armor: 50,
    maxArmor: 100,
    ammo: { plasma: 150, shotgun: 30, annihilator: 10 },
    activeWeapon: "plasma",
    organIntegrity: 100,
    score: 0,
    kills: 0,
    wave: 1,
    organId: "heart",
    isGameOver: false,
    isVictory: false,
    enemiesRemaining: 0,
    isPointerLocked: false,
    isFiring: false,
    faceExpression: "normal",
  });

  useEffect(() => {
    if (!mountRef.current) return;

    const engine = new DoomGameEngine(mountRef.current, {
      onStateUpdate: (newState) => {
        setGameState(newState);
      },
    });
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const selectLevel = (id: OrganId) => {
    if (engineRef.current) {
      engineRef.current.changeOrganLevel(id);
    }
  };

  const selectWeapon = (type: WeaponType) => {
    if (engineRef.current) {
      engineRef.current.setWeapon(type);
    }
  };

  const restartGame = () => {
    if (engineRef.current) {
      engineRef.current.restartGame();
    }
  };

  const currentOrgan = organById[gameState.organId] || organById.heart;
  const activeWeaponInfo = WEAPONS[gameState.activeWeapon];

  // Animated Doom-style Face / Helmet SVG portrait based on health / state
  const renderFace = () => {
    const expr = gameState.faceExpression;
    let eyeColor = "#38bdf8";
    let mouthPath = "M 18 32 Q 24 35 30 32"; // smile/neutral
    let bg = "#1e293b";

    if (expr === "dead") {
      eyeColor = "#ef4444";
      mouthPath = "M 18 35 Q 24 30 30 35"; // frown
      bg = "#450a0a";
    } else if (expr === "critical") {
      eyeColor = "#f59e0b";
      mouthPath = "M 18 34 Q 24 31 30 34";
      bg = "#292524";
    } else if (expr === "hurt") {
      eyeColor = "#ef4444";
      mouthPath = "M 20 33 L 28 33";
      bg = "#7f1d1d";
    } else if (expr === "firing") {
      eyeColor = "#38bdf8";
      mouthPath = "M 18 30 Q 24 38 30 30"; // grit teeth
      bg = "#0f172a";
    }

    return (
      <svg width="48" height="48" viewBox="0 0 48 48" className="doom-portrait" style={{ backgroundColor: bg }}>
        {/* Helmet / Face Outer */}
        <path d="M 8 12 C 8 4, 40 4, 40 12 L 42 36 C 42 44, 6 44, 6 36 Z" fill="#334155" stroke="#64748b" strokeWidth="2" />
        {/* Visor / Eyes */}
        {expr === "dead" ? (
          <g stroke="#ef4444" strokeWidth="2.5">
            <line x1="14" y1="16" x2="22" y2="22" />
            <line x1="22" y1="16" x2="14" y2="22" />
            <line x1="26" y1="16" x2="34" y2="22" />
            <line x1="34" y1="16" x2="26" y2="22" />
          </g>
        ) : (
          <path d="M 12 16 L 36 16 L 34 22 L 14 22 Z" fill={eyeColor} />
        )}
        {/* Mouth / Teeth */}
        <path d={mouthPath} fill="none" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  };

  return (
    <main className="doom-app-shell">
      {/* Top Banner / Organ Selection Bar */}
      <header className="doom-header">
        <div className="doom-brand">
          <span className="doom-logo-badge">DOOM</span>
          <strong>BIO-DEFENDER 3D</strong>
          <small>System Infection Lockdown</small>
        </div>

        <div className="doom-organ-selector">
          <span className="selector-label">SELECT SYSTEM:</span>
          <div className="organ-pills">
            {organs.map((org) => (
              <button
                key={org.id}
                type="button"
                className={`organ-pill ${gameState.organId === org.id ? "active" : ""}`}
                onClick={() => selectLevel(org.id)}
                style={{ "--accent": org.accent } as React.CSSProperties}
              >
                <span className="pill-icon">{org.icon}</span>
                <span className="pill-name">{org.name}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main 3D Canvas Viewport */}
      <div className="doom-viewport-container">
        <div ref={mountRef} className="doom-canvas-mount" />

        {/* Crosshair */}
        {gameState.isPointerLocked && !gameState.isGameOver && (
          <div className="doom-crosshair">
            <Crosshair size={28} className={gameState.isFiring ? "firing" : ""} />
          </div>
        )}

        {/* Click to Lock Pointer Overlay */}
        {!gameState.isPointerLocked && !gameState.isGameOver && (
          <div className="doom-start-overlay">
            <div className="start-modal">
              <h2>DOOM: BIO-DEFENDER</h2>
              <p className="subtext">
                Target Organ: <strong>{currentOrgan.name.toUpperCase()}</strong> ({currentOrgan.system})
              </p>
              <div className="controls-guide">
                <div><span>WASD / Space / Shift</span> Movement</div>
                <div><span>Mouse Aim + Click</span> Fire Weapon</div>
                <div><span>Keys 1, 2, 3</span> Switch Weapons</div>
              </div>
              <button className="start-btn" onClick={() => mountRef.current?.requestPointerLock()}>
                <Zap size={20} /> CLICK TO ENGAGE VIRUSES
              </button>
            </div>
          </div>
        )}

        {/* Game Over / Victory Screen */}
        {gameState.isGameOver && (
          <div className="doom-start-overlay game-over">
            <div className="start-modal result-modal">
              <h2 className={gameState.isVictory ? "victory" : "defeated"}>
                {gameState.isVictory ? "SYSTEM PURIFIED!" : "ORGAN COLLAPSE!"}
              </h2>
              <p className="summary-stats">
                Score: <strong>{gameState.score}</strong> | Kills: <strong>{gameState.kills}</strong> | Wave: <strong>{gameState.wave}</strong>
              </p>
              <button className="start-btn restart" onClick={restartGame}>
                <RotateCcw size={20} /> PURGE AGAIN (KEY R)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Classic Doom Bottom HUD */}
      <footer className="doom-hud">
        {/* Block 1: Ammo Count */}
        <div className="hud-block ammo-block">
          <span className="hud-label">AMMO ({activeWeaponInfo.ammoName})</span>
          <span className="hud-value ammo-val">{gameState.ammo[gameState.activeWeapon]}</span>
        </div>

        {/* Block 2: Health */}
        <div className="hud-block health-block">
          <span className="hud-label"><Heart size={12} /> HEALTH</span>
          <span className={`hud-value ${gameState.health < 30 ? "critical" : ""}`}>{gameState.health}%</span>
        </div>

        {/* Block 3: Animated Doom Portrait */}
        <div className="hud-block portrait-block">
          {renderFace()}
        </div>

        {/* Block 4: Armor */}
        <div className="hud-block armor-block">
          <span className="hud-label"><Shield size={12} /> BIO-ARMOR</span>
          <span className="hud-value armor-val">{gameState.armor}%</span>
        </div>

        {/* Block 5: Weapon Selection Panel */}
        <div className="hud-block weapons-block">
          <span className="hud-label">WEAPONS</span>
          <div className="weapon-buttons">
            {(["plasma", "shotgun", "annihilator"] as WeaponType[]).map((wKey, idx) => (
              <button
                key={wKey}
                type="button"
                className={`weapon-btn ${gameState.activeWeapon === wKey ? "active" : ""}`}
                onClick={() => selectWeapon(wKey)}
              >
                <span className="num">{idx + 1}</span>
                <span className="w-name">{WEAPONS[wKey].name.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Block 6: Organ Health & Threat Meter */}
        <div className="hud-block organ-block">
          <span className="hud-label"><Activity size={12} /> ORGAN INTEGRITY</span>
          <div className="organ-bar-wrap">
            <div className="organ-bar-fill" style={{ width: `${gameState.organIntegrity}%` }} />
            <span className="organ-bar-text">{gameState.organIntegrity}%</span>
          </div>
          <small className="hud-threat">
            <Skull size={10} /> VIRUSES: {gameState.enemiesRemaining}
          </small>
        </div>
      </footer>
    </main>
  );
}
