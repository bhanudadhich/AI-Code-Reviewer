import React, { useEffect, useRef, useState } from "react";
import { IoSettings } from "react-icons/io5";

const LINKS = ["History", "Documentation", "Insights"];
const LINK_IDS = {
  History: "history",
  Documentation: "docs",
  Insights: "insights",
};

const navStyles = `
/* ---------- Entrance animation ---------- */
@keyframes navSlideDown {
  from { opacity: 0; transform: translateY(-100%); }
  to   { opacity: 1; transform: none; }
}

/* ---------- Base navbar (overrides App.css via higher specificity) ---------- */
.navbar.nav-x {
  position: sticky;
  top: 0;
  z-index: 100;
  animation: navSlideDown 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
  transition: background-color 0.3s ease, box-shadow 0.3s ease,
    border-color 0.3s ease, backdrop-filter 0.3s ease;
}
.navbar.nav-x.scrolled {
  background-color: rgb(19 19 27 / 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 8px 30px rgb(0 0 0 / 0.35);
  border-bottom-color: rgb(99 102 241 / 0.35);
}

/* On desktop the wrappers vanish so your original flex layout stays the same */
.nav-panel,
.nav-panel-inner { display: contents; }

/* ---------- Logo ---------- */
.nav-logo { display: flex; align-items: center; cursor: pointer; user-select: none; }
.nav-logo h3 {
  transition: transform 0.3s ease, text-shadow 0.3s ease, letter-spacing 0.3s ease;
}
.nav-logo:hover h3 {
  transform: translateY(-1px) scale(1.04);
  letter-spacing: 0.3px;
  text-shadow: 0 0 18px rgb(99 102 241 / 0.65);
}

/* ---------- Links ---------- */
.navbar.nav-x .links a {
  position: relative;
  color: var(--text-gray);
  text-decoration: none;
  padding: 6px 2px;
  transition: color 0.3s ease, background-color 0.3s ease,
    transform 0.3s ease, opacity 0.4s ease;
}
.navbar.nav-x .links a::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  border-radius: 2px;
  background: var(--blue);
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}
.navbar.nav-x .links a:hover,
.navbar.nav-x .links a[aria-current="page"] { color: var(--text-white); }
.navbar.nav-x .links a:hover::after,
.navbar.nav-x .links a[aria-current="page"]::after {
  transform: scaleX(1);
  transform-origin: left;
}

/* ---------- Buttons ---------- */
.navbar.nav-x .trans,
.navbar.nav-x .blue-btn {
  position: relative;
  overflow: hidden;
  font-family: inherit;
  color: var(--text-white);
  border-radius: 5px;
  white-space: nowrap;
  transition: transform 0.25s ease, box-shadow 0.3s ease,
    background-color 0.3s ease, border-color 0.3s ease, filter 0.3s ease;
}
.navbar.nav-x .trans:hover {
  transform: translateY(-2px);
  border-color: var(--blue);
  box-shadow: 0 6px 16px rgb(0 0 0 / 0.35);
}
.navbar.nav-x .blue-btn {
  color: #fff;
  box-shadow: 0 0 0 rgb(99 102 241 / 0);
}
.navbar.nav-x .blue-btn:hover {
  transform: translateY(-2px);
  filter: brightness(1.12);
  box-shadow: 0 8px 22px rgb(99 102 241 / 0.5);
}
/* shine sweep on the blue button */
.navbar.nav-x .blue-btn::before {
  content: "";
  position: absolute;
  top: 0;
  left: -75%;
  width: 50%;
  height: 100%;
  background: linear-gradient(120deg, transparent, rgb(255 255 255 / 0.35), transparent);
  transform: skewX(-20deg);
  transition: left 0.6s ease;
}
.navbar.nav-x .blue-btn:hover::before { left: 130%; }
.navbar.nav-x .trans:active,
.navbar.nav-x .blue-btn:active { transform: translateY(0) scale(0.97); }

/* ---------- Settings icon ---------- */
.navbar.nav-x .icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), color 0.3s ease;
}
.navbar.nav-x .icon:hover { transform: rotate(90deg) scale(1.1); }

/* ---------- Focus (keyboard users) ---------- */
.navbar.nav-x a:focus-visible,
.navbar.nav-x button:focus-visible,
.navbar.nav-x .icon:focus-visible {
  outline: 2px solid var(--blue);
  outline-offset: 3px;
  border-radius: 6px;
}

/* ---------- Hamburger (hidden on desktop) ---------- */
.nav-burger {
  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 42px;
  height: 42px;
  margin-left: auto;
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease, border-color 0.3s ease;
}
.nav-burger:hover { background: var(--button-black-bg); border-color: var(--blue); }
.nav-burger span {
  width: 18px;
  height: 2px;
  background: var(--text-white);
  border-radius: 2px;
  transition: transform 0.35s ease, opacity 0.25s ease;
}
.nav-burger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.nav-burger.open span:nth-child(2) { opacity: 0; transform: scaleX(0); }
.nav-burger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

/* ---------- Tablet ---------- */
@media (max-width: 1024px) {
  .navbar.nav-x { padding: 0 24px; }
  .navbar.nav-x .links { gap: 1.25rem; margin-left: 24px; }
}

/* ---------- Mobile / small tablet ---------- */
@media (max-width: 900px) {
  .navbar.nav-x { padding: 0 20px; overflow: visible; }
  .nav-burger { display: flex; }

  .navbar.nav-x .nav-panel {
    display: grid;
    grid-template-rows: 0fr;
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 99;
    background-color: var(--secondary-bg, #13131b);
    border-bottom: 1px solid var(--border-color);
    box-shadow: 0 20px 40px rgb(0 0 0 / 0.45);
    opacity: 0;
    visibility: hidden;
    transition: grid-template-rows 0.4s cubic-bezier(0.22, 1, 0.36, 1),
      opacity 0.3s ease, visibility 0s linear 0.4s;
  }
  .navbar.nav-x .nav-panel.open {
    grid-template-rows: 1fr;
    opacity: 1;
    visibility: visible;
    transition-delay: 0s;
  }
  .nav-panel-inner {
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }

  .navbar.nav-x .links {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.25rem;
    margin-left: 0;
    padding: 12px 20px 8px;
    font-size: 15px;
  }
  .navbar.nav-x .links a {
    padding: 12px 14px;
    border-radius: 8px;
    opacity: 0;
    transform: translateY(-8px);
  }
  .navbar.nav-x .nav-panel.open .links a {
    opacity: 1;
    transform: none;
    transition-delay: calc(var(--i) * 60ms + 120ms);
  }
  .navbar.nav-x .links a::after { display: none; }
  .navbar.nav-x .links a:hover { background: var(--button-black-bg); }
  .navbar.nav-x .links a[aria-current="page"] {
    background: var(--button-black-bg);
    box-shadow: inset 3px 0 0 var(--blue);
  }

  .navbar.nav-x .right {
    display: flex;
    margin-left: 0;
    flex-wrap: wrap;
    gap: 0.75rem;
    padding: 8px 20px 20px;
    border-top: 1px solid var(--border-color);
    margin-top: 4px;
    padding-top: 16px;
  }
  .navbar.nav-x .right .trans,
  .navbar.nav-x .right .blue-btn {
    flex: 1 1 140px;
    padding: 10px 20px;
  }
  .navbar.nav-x .right .icon { margin-left: auto; }
}

@media (max-width: 480px) {
  .navbar.nav-x { padding: 0 16px; }
  .navbar.nav-x .links,
  .navbar.nav-x .right { padding-left: 16px; padding-right: 16px; }
}

/* ---------- Respect reduced-motion ---------- */
@media (prefers-reduced-motion: reduce) {
  .navbar.nav-x,
  .navbar.nav-x *,
  .nav-panel { animation: none !important; transition: none !important; }
}
`;

const Navbar = ({ onCopyReport, onDownloadCode, onNavigate, activePanel }) => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const navRef = useRef(null);

  // shadow + blur after scrolling
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // close menu on resize to desktop, Escape key, outside click
  useEffect(() => {
    const onResize = () => window.innerWidth > 900 && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    const onClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener("resize", onResize);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      window.removeEventListener("resize", onResize);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, []);

  const handleLink = (e, label) => {
    e.preventDefault();
    setOpen(false);
    onNavigate?.(LINK_IDS[label]);
  };

  const openSettings = () => {
    setOpen(false);
    onNavigate?.("settings");
  };

  return (
    <>
      <style>{navStyles}</style>

      <div
        ref={navRef}
        className={`navbar nav-x ${scrolled ? "scrolled" : ""}`}
      >
        <div className="logo nav-logo">
          <h3 className="text-[18px] font-[700] text-[var(--blue)]">CodeCop</h3>
        </div>

        <button
          type="button"
          className={`nav-burger ${open ? "open" : ""}`}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`nav-panel ${open ? "open" : ""}`}>
          <div className="nav-panel-inner">
            <div className="links">
              {LINKS.map((label, i) => (
                <a
                  key={label}
                  href="#"
                  style={{ "--i": i }}
                  aria-current={
                    activePanel === LINK_IDS[label] ? "page" : undefined
                  }
                  onClick={(e) => handleLink(e, label)}
                >
                  {label}
                </a>
              ))}
            </div>

            <div className="right">
              <button className="trans" onClick={onCopyReport}>
                Copy Report
              </button>
              <button className="blue-btn" onClick={onDownloadCode}>
                Download Code
              </button>
              <i
                className="icon"
                role="button"
                tabIndex={0}
                aria-label="Settings"
                onClick={openSettings}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openSettings();
                  }
                }}
              >
                <IoSettings />
              </i>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
