"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  BrainCircuit,
  ChevronDown,
  CircleHelp,
  Compass,
  FileText,
  Globe,
  Heart,
  LibraryBig,
  Microscope,
  NotebookPen,
  Play,
  Search,
  Share2,
  Sparkles,
  Stethoscope,
  X,
} from "lucide-react";
import { OrganViewer } from "./OrganViewer";
import { getLocalizedOrgan, organById, organs, type Organ, type OrganId } from "../lib/anatomy-data";
import { useI18n } from "../lib/i18n";

type Modal = "lesson" | "quiz" | "animation" | "system" | null;

/**
 * Renders an organ illustration, or its accent glyph for organs that ship as a
 * 3D model without the painted asset set. Keeps every image slot filled instead
 * of leaving a broken `<img>` behind.
 */
function OrganArt({
  organ,
  asset,
  alt,
  size,
}: {
  organ: Organ;
  asset: "thumb" | "organ" | "microscopic" | "compare" | "location";
  alt: string;
  size?: number;
}) {
  if (!organ.illustrated) {
    // An empty alt means a surrounding control already names this, so the
    // glyph should be skipped rather than announced with no label.
    const labelling = alt ? { role: "img", "aria-label": alt } : { "aria-hidden": true };
    return (
      <span className="art-fallback" style={{ "--art-accent": organ.accent } as React.CSSProperties} {...labelling}>
        {organ.icon}
      </span>
    );
  }
  return (
    <img
      key={`${organ.id}-${asset}`}
      src={`/anatomy/${organ.id}/${asset}.webp`}
      alt={alt}
      width={size}
      height={size}
      loading={asset === "thumb" ? "eager" : "lazy"}
      decoding="async"
    />
  );
}

export function AnatomyApp() {
  const { lang, setLang, t } = useI18n();
  const [organId, setOrganId] = useState<OrganId>("heart");
  const [autoRotate, setAutoRotate] = useState(true);
  const [compare, setCompare] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [query, setQuery] = useState("");
  const [mobileLibrary, setMobileLibrary] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const prefetched = useRef(new Set<OrganId>());

  const rawOrgan = organById[organId];
  const organ = getLocalizedOrgan(rawOrgan, lang);
  const rawReference = organById[organId === "heart" ? "brain" : "heart"];
  const reference = getLocalizedOrgan(rawReference, lang);

  const localizedOrgans = useMemo(
    () => organs.map((item) => getLocalizedOrgan(item, lang)),
    [lang],
  );

  const filteredOrgans = useMemo(
    () => localizedOrgans.filter((item) => `${item.name} ${item.system}`.toLowerCase().includes(query.toLowerCase())),
    [localizedOrgans, query],
  );

  useEffect(() => {
    if (!contentRef.current) return;
    gsap.fromTo(contentRef.current.querySelectorAll("[data-reveal]"),
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.48, stagger: 0.035, ease: "power2.out", overwrite: true },
    );
  }, [organId]);

  const selectOrgan = (id: OrganId) => {
    if (organById[id].illustrated) {
      ["organ", "microscopic", "compare", "location"].forEach((asset) => {
        const image = new Image();
        image.src = `/anatomy/${id}/${asset}.webp`;
      });
    }
    setOrganId(id);
    setMobileLibrary(false);
    setCompare(false);
  };

  // Warms the model in the HTTP cache while the pointer is still travelling,
  // so the switch usually renders without a visible loading pass.
  const prefetchOrgan = (id: OrganId) => {
    if (id === organId || prefetched.current.has(id)) return;
    prefetched.current.add(id);
    void fetch(organById[id].model, { priority: "low" } as RequestInit).catch(() => {});
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="brand" type="button" onClick={() => selectOrgan("heart")} aria-label={t.anatomyHomeAlt}>
          <strong>Anatomy Atelier<sup>✦</sup></strong>
          <em>{t.anatomySubtitle}</em>
        </button>
        <nav className="main-nav" aria-label="Primary navigation">
          <button className="active"><Compass size={17} /> {t.navExplore}</button>
          <button><BrainCircuit size={17} /> {t.navSystems}</button>
          <button onClick={() => setModal("lesson")}><BookOpen size={17} /> {t.navLessons}</button>
          <button><LibraryBig size={17} /> {t.navLibrary}</button>
          <button><NotebookPen size={17} /> {t.navNotes}</button>
        </nav>
        <label className="search-box">
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.searchPlaceholder} />
        </label>
        <button
          type="button"
          className="lang-switch-btn"
          onClick={() => setLang(lang === "en" ? "ru" : "en")}
          style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px", background: "rgba(255,255,255,0.1)", borderRadius: "6px", color: "inherit", cursor: "pointer" }}
        >
          <Globe size={16} />
          <strong>{lang === "en" ? "EN" : "RU"}</strong>
        </button>
        <button className="profile" aria-label="Open learner profile"><span>MA</span><ChevronDown size={15} /></button>
        <button className="mobile-library-trigger" onClick={() => setMobileLibrary(true)} aria-label="Open organ library"><LibraryBig size={20} /></button>
      </header>

      <div className="workspace">
        <aside className={`organ-library ${mobileLibrary ? "open" : ""}`}>
          <div className="panel-heading">
            <span>{t.organLibraryTitle}</span>
            <button aria-label="Close library" className="mobile-close" onClick={() => setMobileLibrary(false)}><X size={17} /></button>
            <button aria-label="Saved organs"><Bookmark size={17} /></button>
          </div>
          <div className="organ-list">
            {filteredOrgans.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`organ-item ${organId === item.id ? "active" : ""}`}
                onClick={() => selectOrgan(item.id)}
                onPointerEnter={() => prefetchOrgan(item.id)}
                onFocus={() => prefetchOrgan(item.id)}
                style={{ "--item-accent": item.accent } as React.CSSProperties}
              >
                <span className="organ-glyph">
                  <OrganArt organ={item} asset="thumb" alt={`${item.name} thumbnail`} size={47} />
                </span>
                <span><b>{item.name}</b><small>{item.system}</small></span>
                {organId === item.id && <Heart className="favorite" size={14} fill="currentColor" />}
              </button>
            ))}
          </div>
          <button className="view-all" onClick={() => setQuery("")}>{t.viewAllOrgans} <ArrowRight size={14} /></button>
          <blockquote>
            <Sparkles size={18} />
            <p>{t.quote1}</p>
            <em>{t.quote2}</em>
          </blockquote>
        </aside>

        <OrganViewer
          organ={organ}
          autoRotate={autoRotate}
          onAutoRotate={setAutoRotate}
          compare={compare}
          onCompare={() => setCompare(!compare)}
        />

        <aside className="info-panel" ref={contentRef}>
          <div className="info-kicker" data-reveal><Heart size={13} fill="currentColor" /> {t.theOrgan(organ.name)}</div>
          <div className="info-title-row" data-reveal>
            <div><h1>{organ.name}</h1><em>{organ.poetic}</em></div>
            <span className="specimen-stamp">
              <OrganArt organ={organ} asset="organ" alt={`${organ.name} anatomical illustration`} size={92} />
            </span>
          </div>
          <p className="description" data-reveal>{organ.description}</p>
          <div className="rule" />
          <h2 data-reveal>{t.keyFacts}</h2>
          <dl className="key-facts">
            <div data-reveal><dt><span>◇</span> {t.factSize}</dt><dd>{organ.size}</dd></div>
            <div data-reveal><dt><span>♙</span> {t.factWeight}</dt><dd>{organ.weight}</dd></div>
            <div data-reveal><dt><span>⌁</span> {t.factDaily}</dt><dd>{organ.dailyFact}</dd></div>
            <div data-reveal><dt><span>⌖</span> {t.factLocation}</dt><dd>{organ.location}</dd></div>
            <div data-reveal><dt><span>❋</span> {t.factBlood}</dt><dd>{organ.bloodSupply}</dd></div>
            <div data-reveal><dt><span>◈</span> {t.factFunction}</dt><dd>{organ.function}</dd></div>
          </dl>
          <div className="medical-note" data-reveal><Stethoscope size={16} /><p><b>{t.medicalImportance}</b>{organ.medical}</p></div>
          <div className="fun-note" data-reveal><Sparkles size={15} /><p><b>{t.didYouKnow}</b>{organ.funFact}</p></div>
          <button className="lesson-button" data-reveal onClick={() => setModal("lesson")}>{t.viewLesson} <ArrowRight size={16} /></button>
          <div className="action-grid" data-reveal>
            <button onClick={() => setModal("animation")}><Play size={15} /> {t.btnAnimate}</button>
            <button onClick={() => setModal("quiz")}><CircleHelp size={15} /> {t.btnQuiz}</button>
            <button onClick={() => setCompare(!compare)} className={compare ? "active" : ""}><Share2 size={15} /> {t.btnCompare}</button>
          </div>
        </aside>
      </div>

      {compare && (
        <section className="compare-strip" aria-label="Organ comparison">
          <div className="compare-organ"><OrganArt organ={organ} asset="thumb" alt="" /><span>Comparing</span><strong>{organ.name}</strong><small>{organ.system}</small></div>
          <b>vs.</b>
          <div className="compare-organ"><OrganArt organ={reference} asset="thumb" alt="" /><span>Reference</span><strong>{reference.name}</strong><small>{reference.system}</small></div>
          <dl><div><dt>Primary role</dt><dd>{organ.function}</dd></div><div><dt>Scale</dt><dd>{organ.size}</dd></div></dl>
          <button onClick={() => setCompare(false)} aria-label="Close comparison"><X size={16} /></button>
        </section>
      )}

      <section className="learning-cards" aria-label={`${organ.name} learning resources`}>
        <article className="curiosity-card">
          <span>✿</span><p>{t.quote1}</p><em>{t.quote2}</em>
        </article>
        <article>
          <header><div><em>{t.microscopicView}</em><h3>{organ.tissue}</h3></div><Microscope size={17} /></header>
          <div className="microscope-visual organ-card-image"><OrganArt organ={organ} asset="microscopic" alt={`${organ.name} microscopic tissue view`} /></div>
          <button onClick={() => setModal("lesson")}>{t.exploreTissue} <ArrowRight size={14} /></button>
        </article>
        <article>
          <header><div><em>{t.compareOrgans}</em><h3>{organ.comparison}</h3></div><Share2 size={17} /></header>
          <div className="comparison-visual organ-card-image"><OrganArt organ={organ} asset="compare" alt={`${organ.comparison} anatomical comparison`} /></div>
          <button onClick={() => setCompare(true)}>{t.openComparison} <ArrowRight size={14} /></button>
        </article>
        <article>
          <header><div><em>{t.functionAnimation}</em><h3>{organ.function}</h3></div><Play size={17} /></header>
          {/* The artwork itself is the control, so the play badge inside it is
              decorative rather than a nested button. */}
          <button
            type="button"
            className="function-visual organ-card-image"
            onClick={() => setModal("animation")}
            aria-label={`Play the ${organ.name.toLowerCase()} function animation`}
          >
            <OrganArt organ={organ} asset="organ" alt="" />
            <i className="function-pulse" />
            <span className="play-badge"><Play size={18} fill="currentColor" /></span>
          </button>
          <button onClick={() => setModal("animation")}>{t.playAnimation} <ArrowRight size={14} /></button>
        </article>
        <article>
          <header><div><em>{t.clinicalNotes}</em><h3>{t.commonConditions}</h3></div><FileText size={17} /></header>
          <ul>{organ.conditions.map((condition) => <li key={condition}>{condition}</li>)}</ul>
          <button onClick={() => setModal("lesson")}>{t.seeAll} <ArrowRight size={14} /></button>
        </article>
        <article className="system-card">
          <header><div><em>{t.whereItWorks}</em><h3>{organ.system}</h3></div><BrainCircuit size={17} /></header>
          <button
            type="button"
            className="system-visual organ-card-image"
            onClick={() => setModal("system")}
            aria-label={`See where the ${organ.name.toLowerCase()} sits in the body`}
          >
            <OrganArt organ={organ} asset="location" alt="" />
          </button>
          <button onClick={() => setModal("system")}>{t.seeSystem} <ArrowRight size={14} /></button>
        </article>
      </section>

      {modal && <LearningModal type={modal} organ={organ} onClose={() => setModal(null)} />}
      {mobileLibrary && <button className="drawer-backdrop" aria-label="Close library" onClick={() => setMobileLibrary(false)} />}
    </main>
  );
}

const MODAL_ICON: Record<Exclude<Modal, null>, string> = {
  quiz: "?",
  animation: "▶",
  system: "⌖",
  lesson: "✦",
};

function LearningModal({ type, organ, onClose }: { type: Exclude<Modal, null>; organ: Organ; onClose: () => void }) {
  const { t } = useI18n();
  const organName = organ.name;
  const title =
    type === "quiz" ? t.quizTitle(organName)
    : type === "animation" ? t.motionTitle(organName)
    : type === "system" ? t.systemInBody(organName)
    : t.insideTitle(organName);
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className={`learning-modal ${type === "system" ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
        <span className="modal-icon">{MODAL_ICON[type]}</span>
        <em>{t.guidedDiscovery}</em>
        <h2 id="modal-title">{title}</h2>
        {type === "quiz" ? (
          <div className="quiz-options">
            <p>{t.quizQuestion(organName)}</p>
            <button onClick={onClose}>{t.quizOption1}</button>
            <button onClick={onClose}>{t.quizOption2}</button>
            <button onClick={onClose}>{t.quizOption3}</button>
          </div>
        ) : type === "system" ? (
          <>
            <p>{organ.location}. Trace how the {organName.toLowerCase()} connects to the rest of the body.</p>
            {/* Shown whole rather than cropped into the circular demo — the
                point of this view is the figure and its vessels. */}
            <figure className="modal-figure">
              <OrganArt organ={organ} asset="location" alt={`${organName} shown in place within the ${organ.system.toLowerCase()}`} />
            </figure>
            <dl className="modal-facts">
              <div><dt>System</dt><dd>{organ.system}</dd></div>
              <div><dt>Primary role</dt><dd>{organ.function}</dd></div>
              <div><dt>Blood supply</dt><dd>{organ.bloodSupply}</dd></div>
            </dl>
            <button className="lesson-button" onClick={onClose}>{t.continueExploring} <ArrowRight size={16} /></button>
          </>
        ) : (
          <>
            <p>Follow the highlighted structures, rotate the specimen, and connect form with function. This short study moment is designed to build a durable mental model.</p>
            <div className={`modal-demo ${type === "animation" ? "moving" : ""}`}><OrganArt organ={organ} asset="organ" alt={`${organName} illustration`} /></div>
            <button className="lesson-button" onClick={onClose}>{t.continueExploring} <ArrowRight size={16} /></button>
          </>
        )}
      </section>
    </div>
  );
}
