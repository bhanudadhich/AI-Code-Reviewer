import React, { useEffect, useMemo, useState } from "react";
import { MdClose, MdDelete } from "react-icons/md";

const TITLES = {
  history: "History",
  docs: "Documentation",
  account: "Account",
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

/* ---------- Account ---------- */
.pm-profile { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
.pm-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  font-size: 24px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #6366f1, #a78bfa);
  border-radius: 50%;
  flex-shrink: 0;
}
.pm-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.pm-field label { font-size: 13px; color: var(--text-gray, #9ca3af); }
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
.pm-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 18px 0; }
.pm-stat {
  padding: 12px;
  text-align: center;
  background: #16181e;
  border: 1px solid var(--border-color, #2a2d36);
  border-radius: 10px;
}
.pm-stat b { display: block; font-size: 20px; }
.pm-stat span { font-size: 11px; color: var(--text-gray, #9ca3af); }

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
  .pm-stats { grid-template-columns: repeat(2, 1fr); }
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
          Jab bhi tum code analyze, explain ya fix karoge, wo yahan save hoga.
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
        <p className="pm-muted">Is filter mein kuch nahi mila.</p>
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
          {history.length} saved (max 30, sirf is browser mein)
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
    <h3>CodeCop kya hai?</h3>
    <p>
      CodeCop ek AI code reviewer hai. Tum code paste karte ho aur ye uska
      score, bugs, security issues aur improvements batata hai.
    </p>

    <h3>Kaise use karein</h3>
    <ol>
      <li>Left side ke editor mein code likho ya paste karo.</li>
      <li>Upar dropdown se language chuno.</li>
      <li>
        <b>Analyze Code</b> dabao. Right side mein review dikhega.
      </li>
    </ol>

    <h3>Features</h3>
    <ul>
      <li>
        <b>Analyze Code:</b> overall score, score breakdown, critical issues,
        warnings, security audit aur refactored code.
      </li>
      <li>
        <b>Explain Code:</b> code ko simple bhasha mein step by step samjhata
        hai.
      </li>
      <li>
        <b>Fix Code:</b> bugs theek karke fixed code seedha editor mein daal
        deta hai. Important code ho to pehle copy kar lo.
      </li>
      <li>
        <b>Copy Report:</b> abhi dikh rahi review ya explanation copy karta hai.
      </li>
      <li>
        <b>Download Code:</b> editor ka code file ki tarah download karta hai.
      </li>
      <li>
        <b>History:</b> pichhle reviews, explanations aur fixes wapas open kar
        sakte ho.
      </li>
    </ul>

    <h3>Scores kaise padhein</h3>
    <p>
      Score 0 se 100 ke beech hota hai. 80+ achha code hai, 50 se 80 mein
      improvement ki jagah hai, aur 50 se kam mein serious problems hain. Ye AI
      ka andaza hai, final decision tumhara hona chahiye.
    </p>

    <h3>Shortcuts</h3>
    <ul>
      <li>
        <kbd>Esc</kbd> kisi bhi popup ko band karta hai.
      </li>
      <li>
        Language dropdown mein <kbd>↑</kbd> <kbd>↓</kbd> aur <kbd>Enter</kbd>{" "}
        chalte hain.
      </li>
    </ul>

    <h3>Zaroori baatein</h3>
    <ul>
      <li>
        Tumhara code AI service (Gemini) ko bheja jata hai, isliye passwords ya
        secret keys paste mat karo.
      </li>
      <li>
        History, settings aur profile sirf tumhare browser mein save hote hain,
        kisi server par nahi.
      </li>
      <li>Kabhi AI busy ho to thodi der baad dobara try karo.</li>
    </ul>
  </div>
);

/* ---------- Account ---------- */
const AccountPanel = ({ profile, onProfileChange, history }) => {
  const stats = useMemo(() => {
    const reviews = history.filter((h) => h.type === "review");
    const avg = reviews.length
      ? Math.round(
          reviews.reduce((sum, h) => sum + (Number(h.score) || 0), 0) /
            reviews.length,
        )
      : 0;
    return {
      reviews: reviews.length,
      explains: history.filter((h) => h.type === "explain").length,
      fixes: history.filter((h) => h.type === "fix").length,
      avg,
    };
  }, [history]);

  const initial = (profile.name || "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <>
      <div className="pm-profile">
        <div className="pm-avatar">{initial}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>
            {profile.name || "Guest"}
          </div>
          <div className="pm-muted">{profile.email || "No email added"}</div>
        </div>
      </div>

      <div className="pm-field">
        <label htmlFor="pm-name">Name</label>
        <input
          id="pm-name"
          className="pm-input"
          type="text"
          maxLength={40}
          placeholder="Apna naam likho"
          value={profile.name}
          onChange={(e) =>
            onProfileChange({ ...profile, name: e.target.value })
          }
        />
      </div>

      <div className="pm-field">
        <label htmlFor="pm-email">Email</label>
        <input
          id="pm-email"
          className="pm-input"
          type="email"
          maxLength={80}
          placeholder="you@example.com"
          value={profile.email}
          onChange={(e) =>
            onProfileChange({ ...profile, email: e.target.value })
          }
        />
      </div>

      <div className="pm-stats">
        <div className="pm-stat">
          <b>{stats.reviews}</b>
          <span>Reviews</span>
        </div>
        <div className="pm-stat">
          <b>{stats.explains}</b>
          <span>Explains</span>
        </div>
        <div className="pm-stat">
          <b>{stats.fixes}</b>
          <span>Fixes</span>
        </div>
        <div className="pm-stat">
          <b>{stats.avg}</b>
          <span>Avg score</span>
        </div>
      </div>

      <p className="pm-muted">
        Ye profile sirf is device ke browser mein save hota hai. Abhi login ya
        cloud sync nahi hai.
      </p>
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
          <div className="pm-muted">
            Auto screen size ke hisaab se chalta hai
          </div>
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
          <div className="pm-muted">Lambi lines editor mein wrap hongi</div>
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
            Editor ke side mein code ka chhota preview
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
  profile,
  onProfileChange,
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
          className="pm-modal"
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
            {panel === "account" && (
              <AccountPanel
                profile={profile}
                onProfileChange={onProfileChange}
                history={history}
              />
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

export default Panels;
