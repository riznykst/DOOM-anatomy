"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type Language = "en" | "ru";

export const translations = {
  en: {
    // Header & Brand
    brandTitle: "NANOBOT",
    brandSubtitle: "BIO-DEFENDER 3D",
    brandDesc: "Circulatory System & Intercellular Fluid",
    modeOnboardingBadge: "🎓 NANOBOT TRAINING",
    modeRealBadge: (diffName: string) => `⚔️ COMBAT MODE (${diffName})`,
    playRealMode: "⚔️ Play Combat Mode",
    goToOnboarding: "🎓 Go to Training",
    aimCursor: "🎯 Aim: Mouse Cursor",
    aimPointerLock: "🔒 Aim: Pointer Lock",
    locationLabel: "LOCATION (ARTERIES, VEINS, CAPILLARIES):",

    // Touch controls
    fireBtn: "FIRE",

    // Aim hints
    pointerLockPrompt: "🎯 CLICK SCREEN TO ENTER POINTER LOCK",
    cursorHint: "🎯 MOVE MOUSE TO AIM | LEFT CLICK TO FIRE",

    // Onboarding Steps
    stepBadge: (step: number) => `STEP ${step} OF 5`,
    step1Title: "Nanobot: Vessel Navigation",
    step2Title: "Nanobot Shooting & Weaponry",
    step3Title: "Virus & Bacteria Analysis",
    step4Title: "Protective Shell & Tissue Integrity",
    step5Title: "Nanobot Ready for Purge!",

    step1Desc: "You are a microscopic Nanobot in first-person view. Maneuver through arteries and capillaries using WASD, Space (ascend), and Shift (descend). In training mode, you are immortal!",
    step2Desc: (destroyed: number) => `Hold Left Click to eliminate threats. Ammo is infinite! Training targets destroyed: ${destroyed}`,
    step3Desc: "Pathogenic viruses and bacteria ahead in intercellular fluid (HP reduced by 50%):",
    step4Desc: "Nanobot armor absorbs 60% of incoming damage. The INTEGRITY meter indicates organ tissue health — protect vessels and tissues from viruses!",
    step5Desc: "Excellent! Nanobot is fully calibrated. Launch the purge protocol for arteries, veins, and intercellular fluids!",

    virusLabel: "🔴 Virus (fast, 22.5 HP)",
    bacteriaLabel: "🟡 Bacteria (ranged shooter, 60 HP)",
    necromancerLabel: "🟣 Necromancer (dangerous strain, 140 HP)",

    prevStep: "Back",
    nextStep: "Next Step",
    startRealGame: "START COMBAT MODE",

    // Start Modal
    modalTitle: "NANOBOT: BIO-DEFENDER 3D",
    modalSubtext: (organName: string) => `You are a first-person Nanobot. Location: ${organName.toUpperCase()} (Arteries, veins, vessels, capillaries, and intercellular fluid)`,
    tabOnboarding: "STEP-BY-STEP TRAINING",
    tabReal: "COMBAT MODE",

    onboardingFeat1: "Nanobot Mission: Travel through arteries, veins, capillaries, and intercellular fluids",
    onboardingFeat2: "Weakened Viruses: All pathogen HP reduced by 50%!",
    onboardingFeat3: "Training Mode: Immortality and infinite weapon energy",

    controlsGuideNav: "WASD / Space / Shift — 3D Nanobot Navigation",
    controlsGuideAim: "Mouse + Left Click — Aim and Fire",
    controlsGuideWeapons: "Keys 1, 2, 3 — Switch Nano-Weapons",

    startTrainingBtn: "START TRAINING FROM STEP 1",
    selectDifficultyTitle: "SELECT DIFFICULTY LEVEL:",
    startCombatBtn: (diffName: string) => `START COMBAT (${diffName})`,

    diffEasyName: "🟢 EASY",
    diffEasyDesc: "Enemy damage -50%, weak viruses.",
    diffMediumName: "🟡 MEDIUM",
    diffMediumDesc: "Standard DOOM balance.",
    diffHardName: "🔴 HARD",
    diffHardDesc: "Aggressive viruses, +50% damage!",

    // Game Over / Victory
    victoryTitle: "SYSTEM PURIFIED!",
    defeatTitle: "ORGAN COLLAPSE!",
    statsSummary: (score: number, kills: number, wave: number) => `Score: ${score} | Kills: ${kills} | Wave: ${wave}`,
    purgeAgainBtn: "PURGE AGAIN (KEY R)",

    // HUD
    hudAmmo: (ammoName: string) => `AMMO (${ammoName})`,
    hudHealth: "HEALTH",
    hudArmor: "BIO-ARMOR",
    hudWeapons: "WEAPONS",
    hudIntegrity: "ORGAN INTEGRITY",
    hudViruses: (count: number) => `VIRUSES: ${count}`,

    // Anatomy Atelier strings
    anatomyHomeAlt: "Anatomy Atelier home",
    anatomySubtitle: "Learn anatomy like an artist",
    navExplore: "Explore",
    navSystems: "Systems",
    navLessons: "Lessons",
    navLibrary: "Library",
    navNotes: "Notes",
    searchPlaceholder: "Search organs, topics…",
    organLibraryTitle: "Organ library",
    viewAllOrgans: "View all organs",
    quote1: "Learning is an act of curiosity.",
    quote2: "Keep exploring!",
    theOrgan: (name: string) => `The ${name}`,
    keyFacts: "Key facts",
    factSize: "Size",
    factWeight: "Weight",
    factDaily: "Daily",
    factLocation: "Location",
    factBlood: "Blood supply",
    factFunction: "Function",
    medicalImportance: "Medical importance",
    didYouKnow: "Did you know",
    viewLesson: "View lesson",
    btnAnimate: "Animate",
    btnQuiz: "Quiz",
    btnCompare: "Compare",
    microscopicView: "Microscopic view",
    exploreTissue: "Explore tissue",
    compareOrgans: "Compare organs",
    openComparison: "Open comparison",
    functionAnimation: "Function animation",
    playAnimation: "Play animation",
    clinicalNotes: "Clinical notes",
    commonConditions: "Common conditions",
    seeAll: "See all",
    whereItWorks: "Where it works",
    seeSystem: "See the system",
    guidedDiscovery: "Guided discovery",
    continueExploring: "Continue exploring",
    quizQuestion: (name: string) => `Which statement best describes the ${name.toLowerCase()}?`,
    quizOption1: "It plays a specialized role in maintaining the body",
    quizOption2: "It works completely independently",
    quizOption3: "It is active only during sleep",
    systemInBody: (name: string) => `${name} in the body`,
    quizTitle: (name: string) => `${name} quick quiz`,
    motionTitle: (name: string) => `${name} in motion`,
    insideTitle: (name: string) => `Inside the ${name.toLowerCase()}`,
  },
  ru: {
    // Header & Brand
    brandTitle: "НАНОБОТ",
    brandSubtitle: "BIO-DEFENDER 3D",
    brandDesc: "Кровеносная система & Межклеточная жидкость",
    modeOnboardingBadge: "🎓 ОБУЧЕНИЕ НАНОБОТА",
    modeRealBadge: (diffName: string) => `⚔️ БОЕВОЙ РЕЖИМ (${diffName})`,
    playRealMode: "⚔️ Играть в реальном режиме",
    goToOnboarding: "🎓 Перейти к Обучению",
    aimCursor: "🎯 Прицел: Курсор мыши",
    aimPointerLock: "🔒 Прицел: Pointer Lock",
    locationLabel: "ЛОКАЦИЯ (АРТЕРИИ, ВЕНЫ, КАПИЛЛЯРЫ):",

    // Touch controls
    fireBtn: "ОГОНЬ",

    // Aim hints
    pointerLockPrompt: "🎯 КЛИКНИТЕ ПО ЭКРАНУ ДЛЯ ВХОДА В POINTER LOCK",
    cursorHint: "🎯 ДВИГАЙТЕ МЫШЬЮ ДЛЯ ПРИЦЕЛИВАНИЯ | ЛКМ — СТРЕЛЬБА",

    // Onboarding Steps
    stepBadge: (step: number) => `ШАГ ${step} ИЗ 5`,
    step1Title: "Нанобот: Навигация в сосудах",
    step2Title: "Стрельба & Вооружение нанобота",
    step3Title: "Анализ вирусов и бактерий",
    step4Title: "Защитная оболочка & Целостность тканей",
    step5Title: "Нанобот готов к зачистке!",

    step1Desc: "Вы — микроскопический Нанобот от первого лица. Маневрируйте по артериям и капиллярам с помощью WASD, Space (вверх) и Shift (вниз). В режиме обучения вы бессмертны!",
    step2Desc: (destroyed: number) => `Зажмите ЛКМ для ликвидации угроз. Заряд бесконечный! Уничтожено тренировочных целей: ${destroyed}`,
    step3Desc: "Впереди патогенные вирусы и бактерии в межклеточной жидкости (HP снижено на 50%):",
    step4Desc: "Броня Нанобота поглощает 60% урона. Индикатор INTEGRITY показывает целостность органа — защитите сосуды и ткани от вирусов!",
    step5Desc: "Отлично! Нанобот полностью настроен. Запустите протокол зачистки артерий, вен и межклеточных жидкостей!",

    virusLabel: "🔴 Вирус (быстрый, 22.5 HP)",
    bacteriaLabel: "🟡 Бактерия (стреляющая, 60 HP)",
    necromancerLabel: "🟣 Некромант (опасный штамм, 140 HP)",

    prevStep: "Назад",
    nextStep: "Следующий шаг",
    startRealGame: "НАЧАТЬ РЕАЛЬНУЮ ИГРУ",

    // Start Modal
    modalTitle: "NANOBOT: BIO-DEFENDER 3D",
    modalSubtext: (organName: string) => `Вы — Нанобот от первого лица. Локация: ${organName.toUpperCase()} (Артерии, вены, сосуды, капилляры и межклеточная жидкость)`,
    tabOnboarding: "ПОШАГОВОЕ ОБУЧЕНИЕ",
    tabReal: "РЕАЛЬНАЯ ИГРА",

    onboardingFeat1: "Миссия Нанобота: Путешествуйте по артериям, венам, капиллярам и межклеточным жидкостям",
    onboardingFeat2: "Ослабленные вирусы: HP всех патогенов снижено на 50%!",
    onboardingFeat3: "Тренировочный режим: Бессмертие и бесконечные заряды орудий",

    controlsGuideNav: "WASD / Space / Shift — Навигация нанобота в 3D",
    controlsGuideAim: "Мышь + ЛКМ — Прицеливание и стрельба",
    controlsGuideWeapons: "Клавиши 1, 2, 3 — Переключение нано-оружия",

    startTrainingBtn: "НАЧАТЬ ОБУЧЕНИЕ С ШАГА 1",
    selectDifficultyTitle: "ВЫБЕРИТЕ УРОВЕНЬ СЛОЖНОСТИ:",
    startCombatBtn: (diffName: string) => `НАЧАТЬ БОЙ (${diffName})`,

    diffEasyName: "🟢 ЛЕГКИЙ",
    diffEasyDesc: "Урон врагов -50%, слабые вирусы.",
    diffMediumName: "🟡 СРЕДНИЙ",
    diffMediumDesc: "Стандартный баланс DOOM.",
    diffHardName: "🔴 СЛОЖНЫЙ",
    diffHardDesc: "Агрессивные вирусы, +50% урона!",

    // Game Over / Victory
    victoryTitle: "SYSTEM PURIFIED!",
    defeatTitle: "ORGAN COLLAPSE!",
    statsSummary: (score: number, kills: number, wave: number) => `Счет: ${score} | Убийств: ${kills} | Волна: ${wave}`,
    purgeAgainBtn: "PURGE AGAIN (КЛАВИША R)",

    // HUD
    hudAmmo: (ammoName: string) => `БОЕЗАПАС (${ammoName})`,
    hudHealth: "ЗДОРОВЬЕ",
    hudArmor: "БИО-БРОНЯ",
    hudWeapons: "ОРУЖИЕ",
    hudIntegrity: "ЦЕЛОСТНОСТЬ ОРГАНА",
    hudViruses: (count: number) => `ВИРУСЫ: ${count}`,

    // Anatomy Atelier strings
    anatomyHomeAlt: "Главная страница Anatomy Atelier",
    anatomySubtitle: "Изучайте анатомию как художник",
    navExplore: "Исследовать",
    navSystems: "Системы",
    navLessons: "Уроки",
    navLibrary: "Библиотека",
    navNotes: "Заметки",
    searchPlaceholder: "Поиск органов, тем…",
    organLibraryTitle: "Библиотека органов",
    viewAllOrgans: "Все органы",
    quote1: "Обучение — это проявление любопытства.",
    quote2: "Продолжайте исследовать!",
    theOrgan: (name: string) => `Орган: ${name}`,
    keyFacts: "Ключевые факты",
    factSize: "Размер",
    factWeight: "Вес",
    factDaily: "Ежедневно",
    factLocation: "Расположение",
    factBlood: "Кровоснабжение",
    factFunction: "Функция",
    medicalImportance: "Медицинское значение",
    didYouKnow: "Знаете ли вы",
    viewLesson: "Смотреть урок",
    btnAnimate: "Анимация",
    btnQuiz: "Викторина",
    btnCompare: "Сравнить",
    microscopicView: "Микроскопический вид",
    exploreTissue: "Исследовать ткань",
    compareOrgans: "Сравнение органов",
    openComparison: "Открыть сравнение",
    functionAnimation: "Анимация функции",
    playAnimation: "Воспроизвести",
    clinicalNotes: "Клинические заметки",
    commonConditions: "Частые заболевания",
    seeAll: "Смотреть все",
    whereItWorks: "Расположение в организме",
    seeSystem: "Смотреть систему",
    guidedDiscovery: "Интерактивное обучение",
    continueExploring: "Продолжить исследование",
    quizQuestion: (name: string) => `Какое утверждение лучше всего описывает ${name.toLowerCase()}?`,
    quizOption1: "Выполняет специализированную роль в поддержании организма",
    quizOption2: "Работает полностью независимо",
    quizOption3: "Активен только во время сна",
    systemInBody: (name: string) => `${name} в организме`,
    quizTitle: (name: string) => `Викторина: ${name}`,
    motionTitle: (name: string) => `${name} в движении`,
    insideTitle: (name: string) => `Внутри органа (${name})`,
  },
};

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: typeof translations.en;
}

const I18nContext = createContext<I18nContextType>({
  lang: "en",
  setLang: () => {},
  t: translations.en,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("app_lang") as Language | null;
      if (saved === "en" || saved === "ru") {
        return saved;
      }
    }
    return "en";
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("app_lang", newLang);
    }
  };

  const t = translations[lang] || translations.en;

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
