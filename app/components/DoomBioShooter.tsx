"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Heart,
  Play,
  RotateCcw,
  Shield,
  Skull,
  Target,
  Zap,
} from "lucide-react";
import { organById, organs, type OrganId } from "../lib/anatomy-data";
import {
  DIFFICULTY_SETTINGS,
  DoomGameEngine,
  WEAPONS,
  type Difficulty,
  type GameMode,
  type GameState,
  type WeaponType,
} from "../lib/three/game-engine";

export function DoomBioShooter() {
  const mountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<DoomGameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>({
    health: 100,
    maxHealth: 100,
    armor: 100,
    maxArmor: 100,
    ammo: { plasma: 300, shotgun: 60, annihilator: 30 },
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
    gameMode: "onboarding",
    difficulty: "medium",
    onboardingStep: 1,
    dummiesDestroyed: 0,
  });

  const [selectedModeTab, setSelectedModeTab] = useState<GameMode>("onboarding");
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("medium");

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

  const startMode = (mode: GameMode, difficulty: Difficulty = selectedDifficulty) => {
    if (engineRef.current) {
      engineRef.current.initMode(mode, difficulty);
      mountRef.current?.requestPointerLock();
    }
  };

  const setOnboardingStep = (step: number) => {
    if (engineRef.current) {
      engineRef.current.setOnboardingStep(step);
    }
  };

  const changeDifficulty = (diff: Difficulty) => {
    setSelectedDifficulty(diff);
    if (engineRef.current) {
      engineRef.current.setDifficulty(diff);
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
          <small className="mode-badge">
            {gameState.gameMode === "onboarding" ? "🎓 ОБУЧЕНИЕ" : `⚔️ РЕАЛЬНАЯ ИГРА (${DIFFICULTY_SETTINGS[gameState.difficulty].name})`}
          </small>
        </div>

        <div className="doom-organ-selector">
          <button
            type="button"
            className="mode-switch-btn"
            onClick={() => {
              if (document.pointerLockElement) document.exitPointerLock();
              if (gameState.gameMode === "onboarding") {
                startMode("real", gameState.difficulty);
              } else {
                startMode("onboarding");
              }
            }}
          >
            {gameState.gameMode === "onboarding" ? "⚔️ Играть в реальном режиме" : "🎓 Перейти к Обучению"}
          </button>

          <span className="selector-label">SELECT SYSTEM / ОРГАН:</span>
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

        {/* Step-by-Step Onboarding Floating Guide Overlay (Active during Pointer Lock) */}
        {gameState.isPointerLocked && gameState.gameMode === "onboarding" && (
          <div className="onboarding-hud-panel">
            <div className="onboarding-hud-header">
              <span className="onboarding-step-badge">ШАГ {gameState.onboardingStep} ИЗ 5</span>
              <strong>
                {gameState.onboardingStep === 1 && "Управление & Движение 3D"}
                {gameState.onboardingStep === 2 && "Тренировка стрельбы & Оружие"}
                {gameState.onboardingStep === 3 && "Обзор врагов & Уязвимости"}
                {gameState.onboardingStep === 4 && "Защита органов & Броня"}
                {gameState.onboardingStep === 5 && "Финал обучения - Готов к бою!"}
              </strong>
            </div>

            <div className="onboarding-hud-body">
              {gameState.onboardingStep === 1 && (
                <p>Двигайтесь с помощью <strong>WASD</strong>. <strong>Space</strong> — вверх, <strong>Shift</strong> — вниз. В режиме онбординга вас <strong>не могут убить</strong>!</p>
              )}
              {gameState.onboardingStep === 2 && (
                <div>
                  <p>Зажмите <strong>ЛКМ</strong> для стрельбы. Патроны <strong>бесконечные</strong>! Уничтожено мишеней: <strong>{gameState.dummiesDestroyed}</strong></p>
                  <div className="step-weapon-tips">
                    <span><strong>1</strong> PLASMA (Быстрый огонь)</span>
                    <span><strong>2</strong> SHOTGUN (Спрей)</span>
                    <span><strong>3</strong> ANNIHILATOR (Ракеты)</span>
                  </div>
                </div>
              )}
              {gameState.onboardingStep === 3 && (
                <div>
                  <p>Впереди пассивные образцы врагов:</p>
                  <div className="enemy-types-preview">
                    <span>🔴 <strong>Вирус</strong> (быстрый, малый HP)</span>
                    <span>🟡 <strong>Бактерия</strong> (прочная, стреляет)</span>
                    <span>🟣 <strong>Некромант</strong> (высокий HP, аура)</span>
                  </div>
                </div>
              )}
              {gameState.onboardingStep === 4 && (
                <p>Броня (BIO-ARMOR) поглощает 60% урона. Индикатор INTEGRITY показывает состояние органа — не дайте вирусам разрушить его!</p>
              )}
              {gameState.onboardingStep === 5 && (
                <p>Отлично! Вы освоили стрельбу, движение и изучили врагов. Вы готовы к настоящей игре!</p>
              )}
            </div>

            <div className="onboarding-hud-controls">
              {gameState.onboardingStep > 1 && (
                <button
                  type="button"
                  className="onboarding-nav-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOnboardingStep(gameState.onboardingStep - 1);
                  }}
                >
                  <ChevronLeft size={16} /> Назад
                </button>
              )}
              {gameState.onboardingStep < 5 ? (
                <button
                  type="button"
                  className="onboarding-nav-btn next"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOnboardingStep(gameState.onboardingStep + 1);
                  }}
                >
                  Следующий шаг <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className="onboarding-nav-btn complete"
                  onClick={(e) => {
                    e.stopPropagation();
                    startMode("real", selectedDifficulty);
                  }}
                >
                  <Play size={16} /> НАЧАТЬ РЕАЛЬНУЮ ИГРУ
                </button>
              )}
            </div>
          </div>
        )}

        {/* Start / Mode Selection Overlay */}
        {!gameState.isPointerLocked && !gameState.isGameOver && (
          <div className="doom-start-overlay">
            <div className="start-modal mode-modal">
              <h2>DOOM: BIO-DEFENDER 3D</h2>
              <p className="subtext">
                Орган назначения: <strong>{currentOrgan.name.toUpperCase()}</strong> ({currentOrgan.system})
              </p>

              {/* Mode Selection Tabs */}
              <div className="mode-tab-selector">
                <button
                  type="button"
                  className={`tab-btn ${selectedModeTab === "onboarding" ? "active" : ""}`}
                  onClick={() => setSelectedModeTab("onboarding")}
                >
                  <BookOpen size={18} /> ПОШАГОВОЕ ОБУЧЕНИЕ
                </button>
                <button
                  type="button"
                  className={`tab-btn ${selectedModeTab === "real" ? "active" : ""}`}
                  onClick={() => setSelectedModeTab("real")}
                >
                  <Zap size={18} /> РЕАЛЬНАЯ ИГРА
                </button>
              </div>

              {selectedModeTab === "onboarding" ? (
                <div className="mode-tab-content">
                  <div className="onboarding-feature-list">
                    <div className="feat-item"><Shield size={16} className="text-emerald-400" /> <span><strong>Бессмертие:</strong> Вас не могут убить (тренировка без риска)</span></div>
                    <div className="feat-item"><Target size={16} className="text-sky-400" /> <span><strong>Тренировка стрельбы:</strong> Мишени и бесконечные патроны</span></div>
                    <div className="feat-item"><Skull size={16} className="text-purple-400" /> <span><strong>Обзор врагов & оружия:</strong> Все 3 типа врагов и 3 вида оружия</span></div>
                  </div>

                  <div className="controls-guide">
                    <div><span>WASD / Space / Shift</span> Движение в 3D</div>
                    <div><span>Мышь + ЛКМ</span> Прицеливание и стрельба</div>
                    <div><span>Клавиши 1, 2, 3</span> Переключение оружия</div>
                  </div>

                  <button className="start-btn onboarding-start-btn" onClick={() => startMode("onboarding")}>
                    <BookOpen size={20} /> НАЧАТЬ ОБУЧЕНИЕ С ШАГА 1
                  </button>
                </div>
              ) : (
                <div className="mode-tab-content">
                  <p className="diff-title">ВЫБЕРИТЕ УРОВЕНЬ СЛОЖНОСТИ:</p>

                  <div className="difficulty-grid">
                    {(["easy", "medium", "hard"] as Difficulty[]).map((dKey) => (
                      <button
                        key={dKey}
                        type="button"
                        className={`diff-card ${selectedDifficulty === dKey ? "active" : ""} ${dKey}`}
                        onClick={() => changeDifficulty(dKey)}
                      >
                        <strong className="diff-name">
                          {dKey === "easy" && "🟢 ЛЕГКИЙ"}
                          {dKey === "medium" && "🟡 СРЕДНИЙ"}
                          {dKey === "hard" && "🔴 СЛОЖНЫЙ"}
                        </strong>
                        <small className="diff-desc">
                          {dKey === "easy" && "Урон врагов -50%, слабые вирусы."}
                          {dKey === "medium" && "Стандартный баланс DOOM."}
                          {dKey === "hard" && "Агрессивные вирусы, +50% урона!"}
                        </small>
                      </button>
                    ))}
                  </div>

                  <button className="start-btn engage-btn" onClick={() => startMode("real", selectedDifficulty)}>
                    <Zap size={20} /> НАЧАТЬ БОЙ ({DIFFICULTY_SETTINGS[selectedDifficulty].name.toUpperCase()})
                  </button>
                </div>
              )}
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
