"use client";

import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowDown,
  ArrowUp,
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
    cursorPos: { x: 0, y: 0 },
    aimMode: "cursor",
  });

  const [selectedModeTab, setSelectedModeTab] = useState<GameMode>("onboarding");
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("medium");
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [isTouchDevice, setIsTouchDevice] = useState<boolean>(false);

  // Joystick touch state
  const joystickContainerRef = useRef<HTMLDivElement>(null);
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState(false);
  const joystickTouchIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Detect mobile touch capability
    const checkTouch = () => {
      if (("ontouchstart" in window) || navigator.maxTouchPoints > 0 || window.innerWidth < 1024) {
        setIsTouchDevice(true);
        if (engineRef.current) {
          engineRef.current.markTouchDevice();
        }
      }
    };
    checkTouch();
    window.addEventListener("resize", checkTouch);
    return () => window.removeEventListener("resize", checkTouch);
  }, []);

  const handleJoystickStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (joystickTouchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    joystickTouchIdRef.current = touch.identifier;
    setIsJoystickActive(true);
    updateJoystick(touch.clientX, touch.clientY);
  };

  const handleJoystickMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (joystickTouchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === joystickTouchIdRef.current) {
        updateJoystick(touch.clientX, touch.clientY);
        break;
      }
    }
  };

  const handleJoystickEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (joystickTouchIdRef.current === null) return;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystickTouchIdRef.current) {
        joystickTouchIdRef.current = null;
        setIsJoystickActive(false);
        setJoystickPos({ x: 0, y: 0 });
        if (engineRef.current) {
          engineRef.current.setTouchMoveVector(0, 0);
        }
        break;
      }
    }
  };

  const updateJoystick = (clientX: number, clientY: number) => {
    if (!joystickContainerRef.current) return;
    const rect = joystickContainerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const maxRadius = rect.width / 2 - 10;

    let deltaX = clientX - centerX;
    let deltaY = clientY - centerY;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance > maxRadius) {
      deltaX = (deltaX / distance) * maxRadius;
      deltaY = (deltaY / distance) * maxRadius;
    }

    setJoystickPos({ x: deltaX, y: deltaY });

    // Normalize input between -1 and 1
    const normX = deltaX / maxRadius;
    const normY = deltaY / maxRadius; // positive is down (backward in screen coords, map to +z)

    if (engineRef.current) {
      engineRef.current.setTouchMoveVector(normX, normY);
    }
  };

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
    setIsGameStarted(true);
    if (engineRef.current) {
      engineRef.current.initMode(mode, difficulty);
      if (!isTouchDevice && gameState.aimMode === "pointerlock") {
        mountRef.current?.requestPointerLock();
      }
    }
  };

  const toggleAimMode = () => {
    const nextMode = gameState.aimMode === "cursor" ? "pointerlock" : "cursor";
    if (engineRef.current) {
      engineRef.current.setAimMode(nextMode);
      if (nextMode === "pointerlock" && !isTouchDevice && isGameStarted) {
        mountRef.current?.requestPointerLock();
      }
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
          <span className="doom-logo-badge">NANOBOT</span>
          <strong>BIO-DEFENDER 3D</strong>
          <small>Кровеносная система & Межклеточная жидкость</small>
          <small className="mode-badge">
            {gameState.gameMode === "onboarding" ? "🎓 ОБУЧЕНИЕ НАНОБОТА" : `⚔️ БОЕВОЙ РЕЖИМ (${DIFFICULTY_SETTINGS[gameState.difficulty].name})`}
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

          {!isTouchDevice && (
            <button
              type="button"
              className={`aim-mode-toggle-btn ${gameState.aimMode === "cursor" ? "active" : ""}`}
              onClick={toggleAimMode}
              title="Переключить режим управления прицелом"
            >
              {gameState.aimMode === "cursor" ? "🎯 Прицел: Курсор мыши" : "🔒 Прицел: Pointer Lock"}
            </button>
          )}

          <span className="selector-label">ЛОКАЦИЯ (АРТЕРИИ, ВЕНЫ, КАПИЛЛЯРЫ):</span>
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

        {/* Crosshair: Desktop Cursor tracking or Center Pointer Lock / Touch */}
        {!gameState.isGameOver && (
          <div
            className={`doom-crosshair ${!gameState.isPointerLocked && !isTouchDevice ? "cursor-follow" : "center-fixed"}`}
            style={
              !gameState.isPointerLocked && !isTouchDevice
                ? {
                    left: `${((gameState.cursorPos.x + 1) / 2) * 100}%`,
                    top: `${((-gameState.cursorPos.y + 1) / 2) * 100}%`,
                    transform: "translate(-50%, -50%)",
                  }
                : {
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                  }
            }
          >
            <Crosshair size={28} className={gameState.isFiring ? "firing" : ""} />
          </div>
        )}

        {/* Mobile Touch Virtual Controls Overlay */}
        {isGameStarted && !gameState.isGameOver && isTouchDevice && (
          <div className="touch-controls-overlay">
            {/* Left Joystick Area */}
            <div
              ref={joystickContainerRef}
              className={`virtual-joystick-base ${isJoystickActive ? "active" : ""}`}
              onTouchStart={handleJoystickStart}
              onTouchMove={handleJoystickMove}
              onTouchEnd={handleJoystickEnd}
              onTouchCancel={handleJoystickEnd}
            >
              <div
                className="virtual-joystick-stick"
                style={{
                  transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
                }}
              />
            </div>

            {/* Right Action Buttons */}
            <div className="touch-action-cluster">
              <div className="touch-up-down-btns">
                <button
                  type="button"
                  className="touch-btn aux-btn"
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    engineRef.current?.setTouchUpDown(true, false);
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    engineRef.current?.setTouchUpDown(false, false);
                  }}
                >
                  <ArrowUp size={20} />
                </button>
                <button
                  type="button"
                  className="touch-btn aux-btn"
                  onTouchStart={(e) => {
                    e.stopPropagation();
                    engineRef.current?.setTouchUpDown(false, true);
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    engineRef.current?.setTouchUpDown(false, false);
                  }}
                >
                  <ArrowDown size={20} />
                </button>
              </div>

              {/* Fire Button */}
              <button
                type="button"
                className="touch-btn fire-btn"
                onTouchStart={(e) => {
                  e.stopPropagation();
                  engineRef.current?.setTouchFiring(true);
                }}
                onTouchEnd={(e) => {
                  e.stopPropagation();
                  engineRef.current?.setTouchFiring(false);
                }}
              >
                🔥
                <span>ОГОНЬ</span>
              </button>
            </div>
          </div>
        )}

        {/* Desktop Resume or Cursor Prompt Overlay */}
        {isGameStarted && !gameState.isPointerLocked && !isTouchDevice && !gameState.isGameOver && gameState.aimMode === "pointerlock" && (
          <div className="doom-resume-prompt" onClick={() => mountRef.current?.requestPointerLock()}>
            <span>🎯 КЛИКНИТЕ ПО ЭКРАНУ ДЛЯ ВХОДА В POINTER LOCK</span>
          </div>
        )}

        {isGameStarted && !gameState.isPointerLocked && !isTouchDevice && !gameState.isGameOver && gameState.aimMode === "cursor" && (
          <div className="doom-cursor-hint">
            <span>🎯 ДВИГАЙТЕ МЫШЬЮ ДЛЯ ПРИЦЕЛИВАНИЯ | ЛКМ — СТРЕЛЬБА</span>
          </div>
        )}

        {/* Step-by-Step Onboarding Floating Guide Overlay (Active when onboarding is started) */}
        {isGameStarted && gameState.gameMode === "onboarding" && !gameState.isGameOver && (
          <div className="onboarding-hud-panel">
            <div className="onboarding-hud-header">
              <span className="onboarding-step-badge">ШАГ {gameState.onboardingStep} ИЗ 5</span>
              <strong>
                {gameState.onboardingStep === 1 && "Нанобот: Навигация в сосудах"}
                {gameState.onboardingStep === 2 && "Стрельба & Вооружение нанобота"}
                {gameState.onboardingStep === 3 && "Анализ вирусов и бактерий"}
                {gameState.onboardingStep === 4 && "Защитная оболочка & Целостность тканей"}
                {gameState.onboardingStep === 5 && "Нанобот готов к зачистке!"}
              </strong>
            </div>

            <div className="onboarding-hud-body">
              {gameState.onboardingStep === 1 && (
                <p>Вы — <strong>микроскопический Нанобот</strong> от первого лица. Маневрируйте по артериям и капиллярам с помощью <strong>WASD</strong>, <strong>Space</strong> (вверх) и <strong>Shift</strong> (вниз). В режиме обучения вы <strong>бессмертны</strong>!</p>
              )}
              {gameState.onboardingStep === 2 && (
                <div>
                  <p>Зажмите <strong>ЛКМ</strong> для ликвидации угроз. Заряд <strong>бесконечный</strong>! Уничтожено тренировочных целей: <strong>{gameState.dummiesDestroyed}</strong></p>
                  <div className="step-weapon-tips">
                    <span><strong>1</strong> PLASMA (Плазменный антиген)</span>
                    <span><strong>2</strong> SHOTGUN (Био-дробовик)</span>
                    <span><strong>3</strong> ANNIHILATOR (Нано-аннигилятор)</span>
                  </div>
                </div>
              )}
              {gameState.onboardingStep === 3 && (
                <div>
                  <p>Впереди патогенные вирусы и бактерии в межклеточной жидкости (HP снижено на 50%):</p>
                  <div className="enemy-types-preview">
                    <span>🔴 <strong>Вирус</strong> (быстрый, 22.5 HP)</span>
                    <span>🟡 <strong>Бактерия</strong> (стреляющая, 60 HP)</span>
                    <span>🟣 <strong>Некромант</strong> (опасный штамм, 140 HP)</span>
                  </div>
                </div>
              )}
              {gameState.onboardingStep === 4 && (
                <p>Броня Нанобота поглощает 60% урона. Индикатор INTEGRITY показывает целостность органа — защитите сосуды и ткани от вирусов!</p>
              )}
              {gameState.onboardingStep === 5 && (
                <p>Отлично! Нанобот полностью настроен. Запустите протокол зачистки артерий, вен и межклеточных жидкостей!</p>
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

        {/* Initial Start / Mode Selection Modal Overlay */}
        {!isGameStarted && !gameState.isGameOver && (
          <div className="doom-start-overlay">
            <div className="start-modal mode-modal">
              <h2>NANOBOT: BIO-DEFENDER 3D</h2>
              <p className="subtext">
                Вы — Нанобот от первого лица. Локация: <strong>{currentOrgan.name.toUpperCase()}</strong> (Артерии, вены, сосуды, капилляры и межклеточная жидкость)
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
                    <div className="feat-item"><Shield size={16} className="text-emerald-400" /> <span><strong>Миссия Нанобота:</strong> Путешествуйте по артериям, венам, капиллярам и межклеточным жидкостям</span></div>
                    <div className="feat-item"><Target size={16} className="text-sky-400" /> <span><strong>Ослабленные вирусы:</strong> HP всех патогенов снижено на 50%!</span></div>
                    <div className="feat-item"><Skull size={16} className="text-purple-400" /> <span><strong>Тренировочный режим:</strong> Бессмертие и бесконечные заряды орудий</span></div>
                  </div>

                  <div className="controls-guide">
                    <div><span>WASD / Space / Shift</span> Навигация нанобота в 3D</div>
                    <div><span>Мышь + ЛКМ</span> Прицеливание и стрельба</div>
                    <div><span>Клавиши 1, 2, 3</span> Переключение нано-оружия</div>
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
