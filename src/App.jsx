import React, { useState, useEffect, useRef, useMemo } from "react";
import "./App.css";
import Navbar from "./components/Navbar";
import ScoreSquare from "./components/ScoreSquare";
import ProgressBar from "./components/ProgressBar";
import Summary from "./components/Summary";
import CriticalBox from "./components/CriticalBox";
import WarningCom from "./components/WarningCom";
import SecurityAudit from "./components/SecurityAudit";
import ProTip from "./components/ProTip";
import { main, explain, fix } from "./AI.js";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { toast } from "react-toastify";
import { Editor } from "@monaco-editor/react";
import { GoCodeReview } from "react-icons/go";
import { MdDone, MdClose, MdDelete } from "react-icons/md";
import {
  FaWandMagicSparkles,
  FaChevronDown,
  FaCheck,
  FaMagnifyingGlass,
  FaScrewdriverWrench,
  FaBookOpen,
} from "react-icons/fa6";

/* ---------- Languages ---------- */
const LANGUAGES = [
  { value: "html", label: "HTML", badge: "H5", color: "#e34f26" },
  { value: "css", label: "CSS", badge: "C3", color: "#38bdf8" },
  { value: "js", label: "JavaScript", badge: "JS", color: "#facc15" },
  { value: "ts", label: "TypeScript", badge: "TS", color: "#3b82f6" },
  { value: "jsx", label: "JSX (React)", badge: "JX", color: "#22d3ee" },
  { value: "tsx", label: "TSX (React + TS)", badge: "TX", color: "#60a5fa" },
  { value: "python", label: "Python", badge: "PY", color: "#4ade80" },
  { value: "java", label: "Java", badge: "JV", color: "#f87171" },
  { value: "c", label: "C", badge: "C", color: "#94a3b8" },
  { value: "cpp", label: "C++", badge: "C+", color: "#818cf8" },
  { value: "csharp", label: "C#", badge: "C#", color: "#a78bfa" },
  { value: "go", label: "Go", badge: "GO", color: "#2dd4bf" },
  { value: "rust", label: "Rust", badge: "RS", color: "#fb923c" },
  { value: "php", label: "PHP", badge: "PH", color: "#a5b4fc" },
  { value: "ruby", label: "Ruby", badge: "RB", color: "#fb7185" },
  { value: "swift", label: "Swift", badge: "SW", color: "#fdba74" },
  { value: "kotlin", label: "Kotlin", badge: "KT", color: "#c084fc" },
  { value: "dart", label: "Dart", badge: "DT", color: "#38bdf8" },
  { value: "r", label: "R", badge: "R", color: "#60a5fa" },
  { value: "matlab", label: "MATLAB", badge: "ML", color: "#fb923c" },
  { value: "perl", label: "Perl", badge: "PL", color: "#a3e635" },
  { value: "lua", label: "Lua", badge: "LU", color: "#818cf8" },
  { value: "scala", label: "Scala", badge: "SC", color: "#f87171" },
  { value: "haskell", label: "Haskell", badge: "HS", color: "#c084fc" },
  { value: "elixir", label: "Elixir", badge: "EX", color: "#d8b4fe" },
  { value: "sql", label: "SQL", badge: "SQ", color: "#fbbf24" },
  { value: "bash", label: "Bash / Shell", badge: "SH", color: "#86efac" },
  { value: "powershell", label: "PowerShell", badge: "PS", color: "#60a5fa" },
  { value: "json", label: "JSON", badge: "{}", color: "#fcd34d" },
  { value: "yaml", label: "YAML", badge: "YM", color: "#f9a8d4" },
  { value: "xml", label: "XML", badge: "</>", color: "#fdba74" },
  { value: "markdown", label: "Markdown", badge: "MD", color: "#cbd5e1" },
  { value: "graphql", label: "GraphQL", badge: "GQ", color: "#f472b6" },
  { value: "dockerfile", label: "Dockerfile", badge: "DK", color: "#38bdf8" },
];

const MONACO_LANG_MAP = {
  js: "javascript",
  ts: "typescript",
  jsx: "javascript",
  tsx: "typescript",
  bash: "shell",
  matlab: "plaintext",
  haskell: "plaintext",
};
const getMonacoLanguage = (value) => MONACO_LANG_MAP[value] || value;

const EXT_MAP = {
  python: "py",
  csharp: "cs",
  rust: "rs",
  ruby: "rb",
  kotlin: "kt",
  markdown: "md",
  bash: "sh",
  powershell: "ps1",
  matlab: "m",
  haskell: "hs",
  elixir: "ex",
  graphql: "graphql",
};
const getFileName = (value) =>
  value === "dockerfile" ? "Dockerfile" : `main.${EXT_MAP[value] || value}`;

/* ---------- Local storage helpers ---------- */
const loadJSON = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};
const saveJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked, ignore */
  }
};
const DEFAULT_SETTINGS = { fontSize: 0, wordWrap: true, minimap: false };
const MAX_HISTORY = 30;

/* ---------- Custom Dropdown ---------- */
const LanguageSelect = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const wrapperRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);

  const selected = LANGUAGES.find((l) => l.value === value) || LANGUAGES[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LANGUAGES;
    return LANGUAGES.filter(
      (l) =>
        l.label.toLowerCase().includes(q) || l.value.toLowerCase().includes(q),
    );
  }, [query]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      const idx = LANGUAGES.findIndex((l) => l.value === value);
      setActiveIndex(idx >= 0 ? idx : 0);
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open, value]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const choose = (lang) => {
    onChange(lang.value);
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[activeIndex]) choose(filtered[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="lang-select" ref={wrapperRef}>
      <button
        type="button"
        className={`lang-trigger ${open ? "open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span
          className="lang-badge"
          style={{ "--badge-color": selected.color }}
        >
          {selected.badge}
        </span>
        <span className="lang-name">{selected.label}</span>
        <i className="lang-chevron">
          <FaChevronDown />
        </i>
      </button>

      {open && (
        <div className="lang-menu" onKeyDown={handleKeyDown}>
          <div className="lang-search">
            <i>
              <FaMagnifyingGlass />
            </i>
            <input
              ref={searchRef}
              type="text"
              placeholder="Search language..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
            />
          </div>

          <ul className="lang-list" ref={listRef} role="listbox">
            {filtered.length === 0 && (
              <li className="lang-empty">No Results</li>
            )}
            {filtered.map((lang, i) => (
              <li
                key={lang.value}
                data-index={i}
                role="option"
                aria-selected={lang.value === value}
                className={`lang-item ${i === activeIndex ? "active" : ""} ${
                  lang.value === value ? "selected" : ""
                }`}
                onClick={() => choose(lang)}
                onMouseEnter={() => setActiveIndex(i)}
              >
                <span
                  className="lang-badge"
                  style={{ "--badge-color": lang.color }}
                >
                  {lang.badge}
                </span>
                <span className="lang-item-name">{lang.label}</span>
                {lang.value === value && (
                  <i className="lang-check">
                    <FaCheck />
                  </i>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/* ================= Popup panels (History, Docs, Insights, Settings) ================= */
const TITLES = {
  history: "History",
  docs: "Documentation",
  insights: "Insights",
  settings: "Settings",
};

const TYPE_LABEL = { review: "Review", explain: "Explain", fix: "Fix" };

const panelStyles = `
@keyframes pmFade { from { opacity: 0; } to { opacity: 1; } }
@keyframes pmPop {
  from { opacity: 0; transform: translateY(14px) scale(0.98); }
  to   { opacity: 1; transform: none; }
}

.pm-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgb(0 0 0 / 0.6);
  backdrop-filter: blur(4px);
  animation: pmFade 0.2s ease both;
}
.pm-modal {
  width: 100%;
  max-width: 720px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  background: var(--secondary-bg, #13131b);
  color: var(--text-white, #e4e1ed);
  border: 1px solid var(--border-color, #2a2d36);
  border-radius: 14px;
  box-shadow: 0 30px 80px rgb(0 0 0 / 0.55);
  animation: pmPop 0.28s cubic-bezier(0.22, 1, 0.36, 1) both;
  overflow: hidden;
}
.pm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color, #2a2d36);
}
.pm-header h2 { margin: 0; font-size: 18px; font-weight: 700; }
.pm-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  font-size: 20px;
  color: inherit;
  background: transparent;
  border: 1px solid var(--border-color, #2a2d36);
  border-radius: 8px;
  cursor: pointer;
  transition: 0.2s;
}
.pm-close:hover { border-color: var(--blue, #6366f1); color: #a5b4fc; }
.pm-body { padding: 20px; overflow-y: auto; }
.pm-muted { color: var(--text-gray, #9ca3af); font-size: 13px; }

/* ---------- Buttons ---------- */
.pm-btn {
  padding: 8px 14px;
  font-size: 13px;
  font-family: inherit;
  color: inherit;
  background: #16181e;
  border: 1px solid var(--border-color, #2a2d36);
  border-radius: 8px;
  cursor: pointer;
  transition: 0.2s;
}
.pm-btn:hover { border-color: var(--blue, #6366f1); color: #a5b4fc; }
.pm-btn.primary { background: var(--blue, #6366f1); border-color: transparent; color: #fff; }
.pm-btn.primary:hover { filter: brightness(1.12); color: #fff; }
.pm-btn.danger:hover { border-color: #f87171; color: #f87171; }
.pm-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* ---------- History ---------- */
.pm-filters { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 14px; }
.pm-chip {
  padding: 5px 12px;
  font-size: 12px;
  font-family: inherit;
  color: var(--text-gray, #9ca3af);
  background: transparent;
  border: 1px solid var(--border-color, #2a2d36);
  border-radius: 999px;
  cursor: pointer;
  transition: 0.2s;
}
.pm-chip.active { color: #fff; background: var(--blue, #6366f1); border-color: transparent; }
.pm-list { display: flex; flex-direction: column; gap: 10px; }
.pm-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: #16181e;
  border: 1px solid var(--border-color, #2a2d36);
  border-radius: 10px;
}
.pm-item-main { flex: 1; min-width: 0; }
.pm-item-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 4px; }
.pm-tag {
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 6px;
  background: rgb(99 102 241 / 0.18);
  color: #a5b4fc;
}
.pm-tag.explain { background: rgb(34 211 238 / 0.15); color: #67e8f9; }
.pm-tag.fix { background: rgb(74 222 128 / 0.15); color: #86efac; }
.pm-score { font-size: 12px; font-weight: 700; color: #fdba74; }
.pm-code {
  margin: 0;
  font-family: ui-monospace, Consolas, monospace;
  font-size: 12px;
  color: var(--text-gray, #9ca3af);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pm-item-actions { display: flex; gap: 8px; align-items: center; }
.pm-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-size: 18px;
  color: inherit;
  background: transparent;
  border: 1px solid var(--border-color, #2a2d36);
  border-radius: 8px;
  cursor: pointer;
  transition: 0.2s;
}
.pm-icon-btn:hover { border-color: #f87171; color: #f87171; }
.pm-empty { text-align: center; padding: 40px 10px; }
.pm-empty p { margin: 4px 0; }
.pm-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; }

/* ---------- Docs ---------- */
.pm-doc h3 { margin: 22px 0 8px; font-size: 15px; color: #a5b4fc; }
.pm-doc h3:first-child { margin-top: 0; }
.pm-doc p, .pm-doc li { font-size: 14px; line-height: 1.6; color: #cbd5e1; }
.pm-doc ul, .pm-doc ol { margin: 0; padding-left: 20px; }
.pm-doc kbd {
  padding: 1px 6px;
  font-size: 12px;
  background: #16181e;
  border: 1px solid var(--border-color, #2a2d36);
  border-radius: 5px;
}

/* ---------- Shared input ---------- */
.pm-input {
  padding: 10px 12px;
  font-size: 14px;
  font-family: inherit;
  color: inherit;
  background: #16181e;
  border: 1px solid var(--border-color, #2a2d36);
  border-radius: 8px;
  outline: none;
  transition: border-color 0.2s;
}
.pm-input:focus { border-color: var(--blue, #6366f1); }

/* ---------- Insights ---------- */
.pm-modal.wide { max-width: 860px; }
.pm-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 14px; }
.pm-kpi {
  padding: 14px;
  background: linear-gradient(145deg, #1a1c25, #14161c);
  border: 1px solid var(--border-color, #2a2d36);
  border-radius: 12px;
}
.pm-kpi span {
  display: block;
  font-size: 11px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-gray, #9ca3af);
}
.pm-kpi b { display: flex; align-items: baseline; gap: 8px; margin-top: 6px; font-size: 26px; }
.pm-grade { font-size: 12px; padding: 2px 8px; border-radius: 6px; font-weight: 700; }
.pm-card {
  padding: 16px;
  margin-bottom: 14px;
  background: #16181e;
  border: 1px solid var(--border-color, #2a2d36);
  border-radius: 12px;
}
.pm-card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.pm-card-head h4 { margin: 0; font-size: 14px; }
.pm-delta { font-size: 12px; font-weight: 700; }
.pm-chart { display: block; width: 100%; height: auto; }
.pm-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
.pm-grid2 .pm-card { margin-bottom: 0; }
.pm-donut-wrap { display: flex; align-items: center; gap: 18px; }
.pm-donut { width: 120px; height: 120px; flex-shrink: 0; }
.pm-legend { display: flex; flex-direction: column; gap: 6px; min-width: 0; font-size: 12px; }
.pm-legend div { display: flex; align-items: center; gap: 8px; }
.pm-legend i { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.pm-bar-row { margin-bottom: 12px; }
.pm-bar-row:last-child { margin-bottom: 0; }
.pm-bar-top { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; }
.pm-bar { height: 8px; overflow: hidden; background: #1f222b; border-radius: 999px; }
.pm-bar > div { height: 100%; border-radius: 999px; transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1); }
.pm-find {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 0;
  font-size: 13px;
  border-bottom: 1px solid var(--border-color, #2a2d36);
}
.pm-find:last-child { border-bottom: none; padding-bottom: 0; }
.pm-find:first-child { padding-top: 0; }
.pm-find-title { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pm-sev {
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 6px;
  flex-shrink: 0;
  background: rgb(248 113 113 / 0.15);
  color: #fca5a5;
}
.pm-sev.warn { background: rgb(251 191 36 / 0.15); color: #fcd34d; }

/* ---------- Settings ---------- */
.pm-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 0;
  border-bottom: 1px solid var(--border-color, #2a2d36);
}
.pm-row:last-of-type { border-bottom: none; }
.pm-row-title { font-size: 14px; font-weight: 600; }
.pm-switch {
  position: relative;
  width: 42px;
  height: 24px;
  flex-shrink: 0;
  background: #2a2d36;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  transition: background-color 0.2s;
}
.pm-switch::after {
  content: "";
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.2s;
}
.pm-switch.on { background: var(--blue, #6366f1); }
.pm-switch.on::after { transform: translateX(18px); }
.pm-select { min-width: 120px; }
.pm-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 18px; }

@media (max-width: 560px) {
  .pm-overlay { padding: 10px; align-items: flex-end; }
  .pm-modal { max-height: 90vh; }
  .pm-kpis { grid-template-columns: repeat(2, 1fr); }
  .pm-grid2 { grid-template-columns: 1fr; }
  .pm-donut-wrap { flex-direction: column; align-items: flex-start; }
  .pm-item { flex-wrap: wrap; }
}
`;

const formatTime = (ts) => {
  try {
    return new Date(ts).toLocaleString([], {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

const firstLine = (code) =>
  (code || "").split("\n").find((l) => l.trim() !== "") || "(empty)";

/* ---------- History ---------- */
const HistoryPanel = ({ history, onOpen, onDelete, onClear }) => {
  const [filter, setFilter] = useState("all");

  const items = useMemo(
    () =>
      filter === "all" ? history : history.filter((h) => h.type === filter),
    [history, filter],
  );

  if (history.length === 0) {
    return (
      <div className="pm-empty">
        <p style={{ fontWeight: 700 }}>No history yet</p>
        <p className="pm-muted">
          Your reviews, explanations and fixes will be saved here automatically.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="pm-filters">
        {["all", "review", "explain", "fix"].map((f) => (
          <button
            key={f}
            type="button"
            className={`pm-chip ${filter === f ? "active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : TYPE_LABEL[f]}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="pm-muted">No items match this filter.</p>
      ) : (
        <div className="pm-list">
          {items.map((item) => (
            <div className="pm-item" key={item.id}>
              <div className="pm-item-main">
                <div className="pm-item-top">
                  <span className={`pm-tag ${item.type}`}>
                    {TYPE_LABEL[item.type] || item.type}
                  </span>
                  <span className="pm-muted">{item.langLabel}</span>
                  {item.type === "review" && (
                    <span className="pm-score">{item.score}/100</span>
                  )}
                  <span className="pm-muted">{formatTime(item.time)}</span>
                </div>
                <p className="pm-code">{firstLine(item.code)}</p>
              </div>
              <div className="pm-item-actions">
                <button
                  type="button"
                  className="pm-btn"
                  onClick={() => onOpen(item)}
                >
                  Open
                </button>
                <button
                  type="button"
                  className="pm-icon-btn"
                  aria-label="Delete"
                  onClick={() => onDelete(item.id)}
                >
                  <MdDelete />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="pm-footer">
        <span className="pm-muted">
          {history.length} saved (max 30, stored in this browser only)
        </span>
        <button type="button" className="pm-btn danger" onClick={onClear}>
          Clear all
        </button>
      </div>
    </>
  );
};

/* ---------- Documentation ---------- */
const DocsPanel = () => (
  <div className="pm-doc">
    <h3>About CodeCop</h3>
    <p>
      CodeCop is an AI-powered code reviewer. Paste your code to get a quality
      score, a list of bugs and security issues, and suggested improvements.
    </p>

    <h3>Getting started</h3>
    <ol>
      <li>Write or paste your code into the editor on the left.</li>
      <li>Select the programming language from the dropdown.</li>
      <li>
        Click <b>Analyze Code</b>. The review appears in the panel on the right.
      </li>
    </ol>

    <h3>Features</h3>
    <ul>
      <li>
        <b>Analyze Code:</b> overall score, score breakdown, critical issues,
        warnings, security audit and a refactored solution.
      </li>
      <li>
        <b>Explain Code:</b> a clear, step-by-step explanation of what your code
        does.
      </li>
      <li>
        <b>Fix Code:</b> corrects bugs and replaces the editor content with the
        fixed version. Copy your original code first if you want to keep it.
      </li>
      <li>
        <b>Copy Report:</b> copies the current review or explanation to your
        clipboard.
      </li>
      <li>
        <b>Download Code:</b> saves the editor content as a file with the
        correct extension.
      </li>
      <li>
        <b>History:</b> reopen your previous reviews, explanations and fixes.
      </li>
      <li>
        <b>Insights:</b> a dashboard with your score trend, language split,
        category averages, recurring findings and day streak. Export your
        history as JSON at any time.
      </li>
    </ul>

    <h3>Understanding scores</h3>
    <p>
      Scores range from 0 to 100. A score of 80 or above indicates healthy code,
      50 to 80 indicates room for improvement, and below 50 indicates serious
      problems. Scores are AI-generated estimates and should be used as
      guidance, not as a final verdict.
    </p>

    <h3>Keyboard shortcuts</h3>
    <ul>
      <li>
        <kbd>Esc</kbd> closes any open panel.
      </li>
      <li>
        In the language dropdown, use <kbd>↑</kbd> <kbd>↓</kbd> to navigate and{" "}
        <kbd>Enter</kbd> to select.
      </li>
    </ul>

    <h3>Privacy and data</h3>
    <ul>
      <li>
        Your code is sent to an AI service (Google Gemini) for processing. Do
        not paste passwords, API keys or other secrets.
      </li>
      <li>
        History and settings are stored locally in your browser and are not
        uploaded to any server.
      </li>
      <li>
        If the AI service is busy, wait a moment and try again. The app
        automatically retries with alternative models.
      </li>
    </ul>
  </div>
);

/* ---------- Insights ---------- */
const PALETTE = [
  "#6366f1",
  "#22d3ee",
  "#4ade80",
  "#fbbf24",
  "#f87171",
  "#a78bfa",
];
const scoreColor = (n) =>
  n >= 80 ? "#4ade80" : n >= 50 ? "#fbbf24" : "#f87171";
const gradeOf = (n) =>
  n >= 90
    ? "A+"
    : n >= 80
      ? "A"
      : n >= 70
        ? "B"
        : n >= 60
          ? "C"
          : n >= 50
            ? "D"
            : "F";

const TrendChart = ({ points }) => {
  const W = 560;
  const H = 180;
  const pad = { l: 30, r: 12, t: 12, b: 16 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const x = (i) => pad.l + (i * iw) / (points.length - 1);
  const y = (v) => pad.t + ih - (Math.max(0, Math.min(100, v)) / 100) * ih;
  const line = points.map((p, i) => x(i) + "," + y(p.score)).join(" ");
  const area =
    x(0) +
    "," +
    (pad.t + ih) +
    " " +
    line +
    " " +
    x(points.length - 1) +
    "," +
    (pad.t + ih);

  return (
    <svg
      viewBox={"0 0 " + W + " " + H}
      className="pm-chart"
      role="img"
      aria-label="Score trend"
    >
      <defs>
        <linearGradient id="pmTrend" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 25, 50, 75, 100].map((v) => (
        <g key={v}>
          <line
            x1={pad.l}
            x2={W - pad.r}
            y1={y(v)}
            y2={y(v)}
            stroke="#2a2d36"
            strokeDasharray="3 4"
          />
          <text
            x={pad.l - 6}
            y={y(v) + 3}
            textAnchor="end"
            fontSize="9"
            fill="#6b7280"
          >
            {v}
          </text>
        </g>
      ))}
      <polygon points={area} fill="url(#pmTrend)" />
      <polyline
        points={line}
        fill="none"
        stroke="#818cf8"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {points.map((p, i) => (
        <circle
          key={i}
          cx={x(i)}
          cy={y(p.score)}
          r="4.5"
          fill="#13131b"
          stroke={scoreColor(p.score)}
          strokeWidth="2"
        >
          <title>{p.label + ": " + p.score + "/100"}</title>
        </circle>
      ))}
    </svg>
  );
};

const Donut = ({ slices, total }) => {
  const R = 42;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <svg
      viewBox="0 0 120 120"
      className="pm-donut"
      role="img"
      aria-label="Language split"
    >
      <circle
        cx="60"
        cy="60"
        r={R}
        fill="none"
        stroke="#1f222b"
        strokeWidth="14"
      />
      {slices.map((sl, i) => {
        const len = (sl.value / total) * C;
        const el = (
          <circle
            key={sl.label}
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke={PALETTE[i % PALETTE.length]}
            strokeWidth="14"
            strokeDasharray={len + " " + (C - len)}
            strokeDashoffset={-offset}
            transform="rotate(-90 60 60)"
          >
            <title>{sl.label + ": " + sl.value}</title>
          </circle>
        );
        offset += len;
        return el;
      })}
      <text
        x="60"
        y="59"
        textAnchor="middle"
        fontSize="20"
        fontWeight="700"
        fill="#e4e1ed"
      >
        {total}
      </text>
      <text x="60" y="73" textAnchor="middle" fontSize="9" fill="#9ca3af">
        total runs
      </text>
    </svg>
  );
};

const BarRow = ({ label, value, max, color, suffix = "" }) => (
  <div className="pm-bar-row">
    <div className="pm-bar-top">
      <span>{label}</span>
      <span style={{ color }}>
        {value}
        {suffix}
      </span>
    </div>
    <div className="pm-bar">
      <div
        style={{
          width: (max ? (value / max) * 100 : 0) + "%",
          background: color,
        }}
      />
    </div>
  </div>
);

const InsightsPanel = ({ history, onExport }) => {
  const d = useMemo(() => {
    const reviews = history.filter((h) => h.type === "review");
    const scores = reviews.map((r) => Number(r.score) || 0);
    const avg = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
    const best = scores.length ? Math.max(...scores) : 0;

    // oldest -> newest, last 12 reviews
    const trend = [...reviews]
      .reverse()
      .slice(-12)
      .map((r) => ({
        score: Number(r.score) || 0,
        label: r.langLabel + " - " + formatTime(r.time),
      }));
    const delta =
      trend.length >= 2 ? trend[trend.length - 1].score - trend[0].score : 0;

    // language split
    const langMap = {};
    history.forEach((h) => {
      langMap[h.langLabel] = (langMap[h.langLabel] || 0) + 1;
    });
    const langSorted = Object.entries(langMap).sort((a, b) => b[1] - a[1]);
    const slices = langSorted
      .slice(0, 5)
      .map(([label, value]) => ({ label, value }));
    const rest = langSorted.slice(5).reduce((sum, [, v]) => sum + v, 0);
    if (rest > 0) slices.push({ label: "Other", value: rest });

    // average score per category
    const catMap = {};
    reviews.forEach((r) => {
      (r.result?.scoreBreakdown || []).forEach((c) => {
        if (!c?.name) return;
        (catMap[c.name] = catMap[c.name] || []).push(Number(c.score) || 0);
      });
    });
    const categories = Object.entries(catMap)
      .map(([name, arr]) => ({
        name,
        n: arr.length,
        avg: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length),
      }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 5);

    // recent findings
    const findings = [];
    reviews.forEach((r) => {
      (r.result?.critical || []).forEach((c) =>
        findings.push({
          sev: "Critical",
          title: c?.title || "Untitled issue",
          lang: r.langLabel,
        }),
      );
      (r.result?.warnings || []).forEach((w) =>
        findings.push({
          sev: "Warning",
          title: w?.title || "Untitled warning",
          lang: r.langLabel,
        }),
      );
    });

    // day streak
    const days = new Set(history.map((h) => new Date(h.time).toDateString()));
    let streak = 0;
    const cursor = new Date();
    if (!days.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
    while (days.has(cursor.toDateString())) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }

    return {
      reviews: reviews.length,
      explains: history.filter((h) => h.type === "explain").length,
      fixes: history.filter((h) => h.type === "fix").length,
      avg,
      best,
      trend,
      delta,
      slices,
      categories,
      findings: findings.slice(0, 6),
      streak,
    };
  }, [history]);

  if (history.length === 0) {
    return (
      <div className="pm-empty">
        <p style={{ fontWeight: 700 }}>No insights yet</p>
        <p className="pm-muted">
          Run a few reviews and your quality trends, language usage and
          recurring issues will show up here.
        </p>
      </div>
    );
  }

  const maxActivity = Math.max(d.reviews, d.explains, d.fixes, 1);

  return (
    <>
      <div className="pm-kpis">
        <div className="pm-kpi">
          <span>Average score</span>
          <b style={{ color: d.reviews ? scoreColor(d.avg) : undefined }}>
            {d.reviews ? d.avg : "-"}
            {d.reviews > 0 && (
              <i
                className="pm-grade"
                style={{
                  fontStyle: "normal",
                  background: scoreColor(d.avg) + "26",
                  color: scoreColor(d.avg),
                }}
              >
                {gradeOf(d.avg)}
              </i>
            )}
          </b>
        </div>
        <div className="pm-kpi">
          <span>Best score</span>
          <b>{d.reviews ? d.best : "-"}</b>
        </div>
        <div className="pm-kpi">
          <span>Total runs</span>
          <b>{history.length}</b>
        </div>
        <div className="pm-kpi">
          <span>Day streak</span>
          <b>{d.streak}</b>
        </div>
      </div>

      <div className="pm-card">
        <div className="pm-card-head">
          <h4>Score trend</h4>
          {d.trend.length >= 2 && (
            <span
              className="pm-delta"
              style={{ color: d.delta >= 0 ? "#4ade80" : "#f87171" }}
            >
              {d.delta >= 0 ? "+" : ""}
              {d.delta} since first review shown
            </span>
          )}
        </div>
        {d.trend.length >= 2 ? (
          <TrendChart points={d.trend} />
        ) : (
          <p className="pm-muted">
            Run at least 2 reviews to see how your code quality changes over
            time.
          </p>
        )}
      </div>

      <div className="pm-grid2">
        <div className="pm-card">
          <div className="pm-card-head">
            <h4>Languages</h4>
          </div>
          <div className="pm-donut-wrap">
            <Donut slices={d.slices} total={history.length} />
            <div className="pm-legend">
              {d.slices.map((sl, i) => (
                <div key={sl.label}>
                  <i style={{ background: PALETTE[i % PALETTE.length] }} />
                  <span>
                    {sl.label} ({sl.value})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pm-card">
          <div className="pm-card-head">
            <h4>Activity</h4>
          </div>
          <BarRow
            label="Reviews"
            value={d.reviews}
            max={maxActivity}
            color="#818cf8"
          />
          <BarRow
            label="Explanations"
            value={d.explains}
            max={maxActivity}
            color="#22d3ee"
          />
          <BarRow
            label="Fixes"
            value={d.fixes}
            max={maxActivity}
            color="#4ade80"
          />
        </div>
      </div>

      {d.categories.length > 0 && (
        <div className="pm-card">
          <div className="pm-card-head">
            <h4>Average score by category</h4>
          </div>
          {d.categories.map((c) => (
            <BarRow
              key={c.name}
              label={c.name}
              value={c.avg}
              max={100}
              color={scoreColor(c.avg)}
              suffix="/100"
            />
          ))}
        </div>
      )}

      {d.findings.length > 0 && (
        <div className="pm-card">
          <div className="pm-card-head">
            <h4>Recent findings</h4>
          </div>
          {d.findings.map((f, i) => (
            <div className="pm-find" key={i}>
              <span className={"pm-sev " + (f.sev === "Warning" ? "warn" : "")}>
                {f.sev}
              </span>
              <span className="pm-find-title">{f.title}</span>
              <span className="pm-muted">{f.lang}</span>
            </div>
          ))}
        </div>
      )}

      <div className="pm-footer">
        <span className="pm-muted">
          Calculated from your saved history on this device.
        </span>
        <button type="button" className="pm-btn" onClick={onExport}>
          Export history (JSON)
        </button>
      </div>
    </>
  );
};

/* ---------- Settings ---------- */
const Toggle = ({ on, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    className={`pm-switch ${on ? "on" : ""}`}
    onClick={() => onChange(!on)}
  />
);

const SettingsPanel = ({
  settings,
  onSettingsChange,
  onResetSettings,
  onClearHistory,
}) => {
  const set = (patch) => onSettingsChange({ ...settings, ...patch });

  return (
    <>
      <div className="pm-row">
        <div>
          <div className="pm-row-title">Editor font size</div>
          <div className="pm-muted">Auto adjusts to your screen size</div>
        </div>
        <select
          className="pm-input pm-select"
          value={settings.fontSize}
          onChange={(e) => set({ fontSize: Number(e.target.value) })}
        >
          <option value={0}>Auto</option>
          {[12, 13, 14, 16, 18, 20].map((n) => (
            <option key={n} value={n}>
              {n}px
            </option>
          ))}
        </select>
      </div>

      <div className="pm-row">
        <div>
          <div className="pm-row-title">Word wrap</div>
          <div className="pm-muted">Wrap long lines inside the editor</div>
        </div>
        <Toggle
          on={settings.wordWrap}
          label="Word wrap"
          onChange={(v) => set({ wordWrap: v })}
        />
      </div>

      <div className="pm-row">
        <div>
          <div className="pm-row-title">Minimap</div>
          <div className="pm-muted">
            Show a small code overview beside the editor
          </div>
        </div>
        <Toggle
          on={settings.minimap}
          label="Minimap"
          onChange={(v) => set({ minimap: v })}
        />
      </div>

      <div className="pm-actions">
        <button type="button" className="pm-btn" onClick={onResetSettings}>
          Reset settings
        </button>
        <button
          type="button"
          className="pm-btn danger"
          onClick={onClearHistory}
        >
          Clear history
        </button>
      </div>
    </>
  );
};

/* ---------- Modal shell ---------- */
const Panels = ({
  panel,
  onClose,
  history,
  onOpenHistory,
  onDeleteHistory,
  onClearHistory,
  settings,
  onSettingsChange,
  onResetSettings,
  onExport,
}) => {
  useEffect(() => {
    if (!panel) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [panel, onClose]);

  if (!panel) return null;

  return (
    <>
      <style>{panelStyles}</style>
      <div
        className="pm-overlay"
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className={"pm-modal" + (panel === "insights" ? " wide" : "")}
          role="dialog"
          aria-modal="true"
          aria-label={TITLES[panel]}
        >
          <div className="pm-header">
            <h2>{TITLES[panel]}</h2>
            <button
              type="button"
              className="pm-close"
              aria-label="Close"
              onClick={onClose}
            >
              <MdClose />
            </button>
          </div>

          <div className="pm-body">
            {panel === "history" && (
              <HistoryPanel
                history={history}
                onOpen={onOpenHistory}
                onDelete={onDeleteHistory}
                onClear={onClearHistory}
              />
            )}
            {panel === "docs" && <DocsPanel />}
            {panel === "insights" && (
              <InsightsPanel history={history} onExport={onExport} />
            )}
            {panel === "settings" && (
              <SettingsPanel
                settings={settings}
                onSettingsChange={onSettingsChange}
                onResetSettings={onResetSettings}
                onClearHistory={onClearHistory}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

/* ---------- App ---------- */
const App = () => {
  const [language, setLanguage] = useState("js");
  const [code, setCode] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [isNoContent, setIsNoContent] = useState(true);
  const [screen, setScreen] = useState("analyze");
  const [data, setData] = useState(null);
  const [explainData, setExplainData] = useState("");
  const [isExplaining, setIsExplaining] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [panel, setPanel] = useState(null);
  const [history, setHistory] = useState(() => loadJSON("codecop_history", []));
  const [settings, setSettings] = useState(() => ({
    ...DEFAULT_SETTINGS,
    ...loadJSON("codecop_settings", {}),
  }));

  useEffect(() => {
    saveJSON("codecop_history", history);
  }, [history]);
  useEffect(() => {
    saveJSON("codecop_settings", settings);
  }, [settings]);

  const currentLang =
    LANGUAGES.find((l) => l.value === language) || LANGUAGES[0];
  const lineCount = code.split("\n").length;

  useEffect(() => {
    const updateFont = () => {
      const w = window.innerWidth;
      setFontSize(w < 480 ? 12 : w < 900 ? 13 : 14);
    };
    updateFont();
    window.addEventListener("resize", updateFont);
    return () => window.removeEventListener("resize", updateFont);
  }, []);

  const handleEditorWillMount = (monaco) => {
    monaco.editor.defineTheme("vcode-review-theme", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6b7280", fontStyle: "italic" },
        { token: "keyword", foreground: "a5b4fc" },
        { token: "string", foreground: "86efac" },
        { token: "number", foreground: "fdba74" },
      ],
      colors: {
        "editor.background": "#0f1115",
        "editor.foreground": "#e4e1ed",
        "editorLineNumber.foreground": "#4b5563",
        "editorLineNumber.activeForeground": "#a5b4fc",
        "editor.lineHighlightBackground": "#16181e",
        "editor.selectionBackground": "#6366f155",
        "editorCursor.foreground": "#6366f1",
        "editorGutter.background": "#0f1115",
      },
    });
  };

  /* ---------- Explain ---------- */
  const explain_data = async () => {
    if (isExplaining) return;

    if (code.trim() === "") {
      toast.error("Please enter some code to explain");
      return;
    }

    setScreen("explain");
    setIsExplaining(true);
    try {
      const res = await explain(code, currentLang.label);
      setExplainData(res);
      addHistory({
        type: "explain",
        language,
        langLabel: currentLang.label,
        code,
        result: res,
      });
    } catch (err) {
      console.error(err);
      toast.error("Unable to explain the code. Please try again in a moment.");
    } finally {
      setIsExplaining(false);
    }
  };

  /* ---------- Fix ---------- */
  const fix_code = async () => {
    if (isFixing) return;

    if (code.trim() === "") {
      toast.error("Please enter some code to fix");
      return;
    }

    setIsFixing(true);
    try {
      const res = await fix(code, currentLang.label);
      const cleaned = res
        .replace(/^\s*```[a-zA-Z0-9+#-]*\n?/, "")
        .replace(/\n?```\s*$/, "");
      setCode(cleaned);
      addHistory({
        type: "fix",
        language,
        langLabel: currentLang.label,
        code,
        result: cleaned,
      });
      toast.success("Code fixed. The editor has been updated.");
    } catch (err) {
      console.error(err);
      toast.error("Unable to fix the code. Please try again in a moment.");
    } finally {
      setIsFixing(false);
    }
  };

  /* ---------- Analyze ---------- */
  const get_response = async () => {
    if (isAnalyzing) return;

    if (code.trim() === "") {
      toast.error("Please enter some code to analyze");
      return;
    }

    setScreen("analyze");
    setIsAnalyzing(true);
    try {
      const res = await main(code, currentLang.label);
      const clean = res.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setData(parsed);
      addHistory({
        type: "review",
        language,
        langLabel: currentLang.label,
        code,
        result: parsed,
        score: parsed.overallScore ?? 0,
      });
      setScreen("analyze");
      setIsNoContent(false);
    } catch (err) {
      console.error(err);
      toast.error("Unable to analyze the code. Please try again in a moment.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  /* ---------- Copy report / Download code ---------- */
  const downloadFile = (filename, content, type = "text/plain") => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fmt = (i) =>
    typeof i === "string"
      ? i
      : Object.values(i)
          .filter((v) => typeof v === "string")
          .join(" - ");

  const buildReportText = () => {
    if (screen === "explain") return explainData;
    if (!data) return "";
    const lines = [];
    lines.push(`CODE REVIEW REPORT (${currentLang.label})`);
    lines.push(`Overall Score: ${data.overallScore ?? 0}/100`);
    lines.push(`Rules checked: ${data.rulesChecked ?? 0}`);
    lines.push("");
    lines.push("SCORE BREAKDOWN");
    data.scoreBreakdown?.forEach((s) => lines.push(`- ${s.name}: ${s.score}`));
    lines.push("");
    lines.push(
      "SUMMARY: " +
        [data.summary?.before, data.summary?.highlight, data.summary?.after]
          .filter(Boolean)
          .join(" "),
    );
    if (data.critical?.length) {
      lines.push("", "CRITICAL");
      data.critical.forEach((c) => lines.push(`- ${fmt(c)}`));
    }
    if (data.warnings?.length) {
      lines.push("", "WARNINGS");
      data.warnings.forEach((w) => lines.push(`- ${fmt(w)}`));
    }
    if (data.securityAudit?.compliance?.length) {
      lines.push("", "COMPLIANCE");
      data.securityAudit.compliance.forEach((c) =>
        lines.push(`- [${c.ok ? "x" : " "}] ${c.text}`),
      );
    }
    if (data.refactoredCode) {
      lines.push("", "REFACTORED CODE", data.refactoredCode);
    }
    if (data.proTip) lines.push("", `PRO TIP: ${data.proTip}`);
    return lines.join("\n");
  };

  const copyReport = async () => {
    const text = buildReportText();
    if (!text.trim()) {
      toast.error("Run Analyze or Explain first, then copy the report.");
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Report copied!");
    } catch {
      toast.error("Unable to copy to the clipboard");
    }
  };

  const downloadCode = () => {
    if (code.trim() === "") {
      toast.error("There is no code to download");
      return;
    }
    downloadFile(getFileName(language), code);
    toast.success("Code downloaded!");
  };

  /* ---------- History / settings handlers ---------- */
  const addHistory = (entry) => {
    setHistory((h) =>
      [
        {
          id: Date.now() + "-" + Math.random().toString(36).slice(2, 7),
          time: Date.now(),
          ...entry,
        },
        ...h,
      ].slice(0, MAX_HISTORY),
    );
  };

  const openHistory = (item) => {
    setLanguage(item.language);
    if (item.type === "review") {
      setCode(item.code);
      setData(item.result);
      setScreen("analyze");
      setIsNoContent(false);
    } else if (item.type === "explain") {
      setCode(item.code);
      setExplainData(item.result);
      setScreen("explain");
    } else {
      setCode(item.result);
    }
    setPanel(null);
    toast.success("Opened from history");
  };

  const deleteHistory = (id) =>
    setHistory((h) => h.filter((item) => item.id !== id));

  const clearHistory = () => {
    if (history.length === 0) {
      toast.info("History is already empty");
      return;
    }
    if (window.confirm("Delete all history? This cannot be undone.")) {
      setHistory([]);
      toast.success("History cleared");
    }
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    toast.success("Settings reset to defaults");
  };

  const exportHistory = () => {
    if (history.length === 0) {
      toast.info("There is no history to export");
      return;
    }
    downloadFile(
      "codecop-history.json",
      JSON.stringify(history, null, 2),
      "application/json",
    );
    toast.success("History exported");
  };

  const isBusy = screen === "analyze" ? isAnalyzing : isExplaining;
  const hasResult = screen === "analyze" ? !!data : !!explainData;

  return (
    <div>
      <Navbar
        onCopyReport={copyReport}
        onDownloadCode={downloadCode}
        onNavigate={setPanel}
        activePanel={panel}
      />
      <div className="container">
        <div className="left">
          <div className="left-header">
            <LanguageSelect value={language} onChange={setLanguage} />

            <button
              className={`analyze-btn ${isAnalyzing ? "loading" : ""}`}
              onClick={get_response}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <span className="spinner"></span>
              ) : (
                <i className="wand">
                  <FaWandMagicSparkles />
                </i>
              )}
              <span className="btn-text">
                {isAnalyzing ? "Analyzing..." : "Analyze Code"}
              </span>
            </button>
          </div>

          <div className="left-body">
            <div className="editor-frame">
              <div className="editor-tabbar">
                <div
                  className="editor-tab"
                  style={{ "--tab-color": currentLang.color }}
                >
                  <span
                    className="lang-badge"
                    style={{ "--badge-color": currentLang.color }}
                  >
                    {currentLang.badge}
                  </span>
                  <span className="editor-tab-name">
                    {getFileName(language)}
                  </span>
                </div>
              </div>

              <div className="code-editor">
                <Editor
                  height="100%"
                  theme="vcode-review-theme"
                  language={getMonacoLanguage(language)}
                  value={code}
                  onChange={(value) => setCode(value ?? "")}
                  beforeMount={handleEditorWillMount}
                  options={{
                    fontSize: settings.fontSize || fontSize,
                    minimap: { enabled: settings.minimap },
                    padding: { top: 16 },
                    smoothScrolling: true,
                    cursorBlinking: "smooth",
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    wordWrap: settings.wordWrap ? "on" : "off",
                    lineNumbersMinChars: 3,
                  }}
                ></Editor>
              </div>

              <div className="editor-status">
                <span className="status-lang">
                  <i
                    className="status-dot"
                    style={{ "--status-color": currentLang.color }}
                  />
                  {currentLang.label}
                </span>
                <span className="status-meta">
                  <span>{lineCount} lines</span>
                  <span className="status-chars">{code.length} chars</span>
                </span>
              </div>
            </div>
          </div>

          <div className="action-bar">
            <button
              type="button"
              className="action-btn fix"
              onClick={fix_code}
              disabled={isFixing}
            >
              <i className="action-icon">
                <FaScrewdriverWrench />
              </i>
              <span className="action-label">
                {isFixing ? "Fixing..." : "Fix Code"}
              </span>
            </button>
            <button
              type="button"
              className="action-btn explain"
              onClick={explain_data}
              disabled={isExplaining}
            >
              <i className="action-icon">
                <FaBookOpen />
              </i>
              <span className="action-label">
                {isExplaining ? "Explaining..." : "Explain Code"}
              </span>
            </button>
          </div>
        </div>

        <div className="right-panel">
          <div className="review-frame">
            <div className="review-tabbar">
              <div className="review-tab">
                <i className="review-tab-icon">
                  <GoCodeReview />
                </i>
                <span>{screen === "explain" ? "Explanation" : "Review"}</span>
              </div>
            </div>

            {isBusy ? (
              <div className="empty-state">
                <p className="empty-title">
                  {screen === "explain"
                    ? "Explaining your code..."
                    : "Analyzing your code..."}
                </p>
                <p className="empty-text">Please wait a moment.</p>
              </div>
            ) : !hasResult ? (
              <div className="empty-state">
                <i className="empty-icon">
                  <GoCodeReview />
                </i>
                <p className="empty-title">No review yet</p>
                <p className="empty-text">
                  Your code review will show up here.
                </p>

                <ol className="empty-steps">
                  <li>
                    <span className="step-no">1</span>
                    Write or paste your code
                  </li>
                  <li>
                    <span className="step-no">2</span>
                    Pick the language
                  </li>
                  <li>
                    <span className="step-no">3</span>
                    Click Analyze Code
                  </li>
                </ol>
              </div>
            ) : (
              <div className="review-result">
                {screen === "analyze" ? (
                  <div className="w-full h-full flex-1 p-[20px]">
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 20,
                      }}
                    >
                      <ScoreSquare score={data?.overallScore ?? 0} />

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                        }}
                      >
                        <h3 className="text-[25px] font-[700] m-0 p-0">
                          Overall Score
                        </h3>
                        <p className="m-0 p-0 text-gray-400">
                          Analysis complete based on {data?.rulesChecked ?? 0}{" "}
                          rules.
                        </p>
                      </div>
                    </div>

                    {/* Score breakdown (2 columns grid) */}
                    <div className="grid grid-cols-2 mt-6 items-center gap-[10px]">
                      {data?.scoreBreakdown?.map((item, index) => (
                        <ProgressBar
                          key={index}
                          name={item.name}
                          score={item.score}
                        />
                      ))}
                    </div>

                    {/* Summary */}
                    <div className="mt-6">
                      <Summary
                        before={data?.summary?.before}
                        highlight={data?.summary?.highlight}
                        after={" " + (data?.summary?.after || "")}
                      />
                    </div>

                    {/* CRITICAL */}
                    {data?.critical?.length > 0 && (
                      <div className="critical_con mt-6">
                        <p className="font-[700] text-[#FFB4AB] mb-2">
                          CRITICAL
                        </p>
                        <div className="flex flex-col gap-[10px]">
                          {data.critical.map((item, i) => (
                            <CriticalBox key={i} data={item} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* WARNING */}
                    {data?.warnings?.length > 0 && (
                      <div className="warning_con mt-6">
                        <p className="font-[700] text-[#FF8783] mb-2">
                          WARNING
                        </p>
                        {data.warnings.map((item, i) => (
                          <WarningCom key={i} data={item} />
                        ))}
                      </div>
                    )}

                    {/* Security Audit */}
                    {data?.securityAudit?.metrics?.length > 0 && (
                      <div className="security_audit mt-6">
                        <p className="font-[700] text-gray-400 mb-2">
                          Security Audit
                        </p>
                        <div className="flex items-center gap-[15px]">
                          {data.securityAudit.metrics.map((item, i) => (
                            <SecurityAudit key={i} data={item} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Compliance & Standards */}
                    {data?.securityAudit?.compliance?.length > 0 && (
                      <div className="Compliance_Standards mt-6">
                        <p className="font-[700] text-gray-400 mb-5">
                          Compliance & Standards
                        </p>

                        {data.securityAudit.compliance.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-[15px] mb-3"
                          >
                            <i
                              className={`text-[20px] ${
                                item.ok ? "text-green-500" : "text-gray-400"
                              }`}
                            >
                              {item.ok ? <MdDone /> : <MdClose />}
                            </i>
                            <p
                              className={`font-[600] ${
                                item.ok ? "" : "text-gray-400"
                              }`}
                            >
                              {item.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Refactored Solution */}
                    {data?.refactoredCode && (
                      <div className="mt-6">
                        <p className="font-[700] text-gray-400 mb-2">
                          REFACTORED SOLUTION
                        </p>
                        <pre className="p-[15px] text-[13px] text-gray-200 bg-[#0f1115] border border-gray-700 rounded-lg overflow-x-auto m-0">
                          <code>{data.refactoredCode}</code>
                        </pre>
                      </div>
                    )}

                    {/* Pro Tip */}
                    {data?.proTip && (
                      <div className="mt-6">
                        <ProTip
                          data={{ title: "PRO TIP", text: data.proTip }}
                        />
                      </div>
                    )}

                    <div className="h-[40px]"></div>
                  </div>
                ) : (
                  <div className="w-full h-full flex-1 p-[20px]">
                    <MarkdownPreview
                      source={explainData}
                      wrapperElement={{ "data-color-mode": "dark" }}
                      style={{ background: "transparent", padding: 0 }}
                    />
                    <div className="h-[40px]"></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Panels
        panel={panel}
        onClose={() => setPanel(null)}
        history={history}
        onOpenHistory={openHistory}
        onDeleteHistory={deleteHistory}
        onClearHistory={clearHistory}
        settings={settings}
        onSettingsChange={setSettings}
        onResetSettings={resetSettings}
        onExport={exportHistory}
      />
    </div>
  );
};

export default App;
