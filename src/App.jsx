import React, { useState, useEffect, useMemo, useCallback } from "react";
const pad2 = (n) => String(n).padStart(2, "0");
/* ============================================================================
   RELICWARE
   An AI mentorship plaregdtform. Tafdsfdfshe greatest minds in history, rebuilt as
   reasoning partners for mfadsfdsdfffsdrfsfssdofsadafdern problems.
fsdsfdsfsdfdsfsdffsdsfsdfds
   Everythingsaa — dsfgata, lodskflfdmgicsfsdf, markup and styling — lives in this single file.
   Map: config -> dfsfata -sfdsdf> sfssadfstdsorsfdfdse -> api ->dsfsd icons -> scenes -> styles
        -> primitives -> views -> shell
   ========================================================================== */

function formatOffset(date) {
  const offsetMin = -date.getTimezoneOffset();
  const sign = offsetMin >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMin);
  return `UTC${sign}${pad2(Math.floor(abs / 60))}:${pad2(abs % 60)}`;
}

function formatDate(date) {
  try {
    return date
      .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      .toUpperCase()
      .replace(/,/g, "");
  } catch (e) {
    return "NOT EXPOSED";
  }
}

function detectOS(ua, platform) {
  const s = `${platform || ""} ${ua || ""}`;
  if (/Android/i.test(s)) return "ANDROID";
  if (/iPhone|iPad|iPod/i.test(s)) return "iOS";
  if (/Win/i.test(s)) return "WINDOWS";
  if (/Mac/i.test(s)) return "MACOS";
  if (/CrOS/i.test(s)) return "CHROME OS";
  if (/Linux/i.test(s)) return "LINUX";
  return "NOT EXPOSED";
}

function detectBrowser(ua) {
  if (!ua) return "NOT EXPOSED";
  if (/Edg\//.test(ua)) return "EDGE";
  if (/OPR\//.test(ua) || /Opera/i.test(ua)) return "OPERA";
  if (/Chrome\//.test(ua) && !/Chromium/i.test(ua)) return "CHROME";
  if (/Firefox\//.test(ua)) return "FIREFOX";
  if (/Safari\//.test(ua) && !/Chrome/i.test(ua)) return "SAFARI";
  return "UNKNOWN";
}

function detectWebGL() {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    return !!gl;
  } catch (e) {
    return false;
  }
}

function getOrientation() {
  try {
    if (window.screen && window.screen.orientation && window.screen.orientation.type) {
      return window.screen.orientation.type.includes("portrait") ? "PORTRAIT" : "LANDSCAPE";
    }
  } catch (e) {
    /* noop */
  }
  return window.innerHeight >= window.innerWidth ? "PORTRAIT" : "LANDSCAPE";
}

/* --------------------------------- hooks --------------------------------- */

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  });
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return undefined;
    const mql = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    setMatches(mql.matches);
    if (mql.addEventListener) mql.addEventListener("change", handler);
    else mql.addListener(handler);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", handler);
      else mql.removeListener(handler);
    };
  }, [query]);
  return matches;
}

function useOnlineStatus() {
  const [online, setOnline] = useState(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}

function useStaticDeviceInfo() {
  return useMemo(() => {
    const ua = (typeof navigator !== "undefined" && navigator.userAgent) || "";
    const platform =
      (navigator.userAgentData && navigator.userAgentData.platform) ||
      navigator.platform ||
      "";
    return {
      os: detectOS(ua, platform),
      browser: detectBrowser(ua),
      cores: navigator.hardwareConcurrency || null,
      memory: navigator.deviceMemory || null,
      touch: "ontouchstart" in window || (navigator.maxTouchPoints || 0) > 0,
      webgl: detectWebGL(),
      language: navigator.language ? navigator.language.toUpperCase() : "NOT EXPOSED",
    };
  }, []);
}

function useDisplayInfo() {
  const snapshot = () => ({
    vw: window.innerWidth,
    vh: window.innerHeight,
    sw: window.screen.width,
    sh: window.screen.height,
    dpr: window.devicePixelRatio || 1,
    orientation: getOrientation(),
  });
  const [display, setDisplay] = useState(snapshot);
  useEffect(() => {
    const update = () => setDisplay(snapshot());
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    let orientationRef = null;
    try {
      if (window.screen && window.screen.orientation && window.screen.orientation.addEventListener) {
        orientationRef = window.screen.orientation;
        orientationRef.addEventListener("change", update);
      }
    } catch (e) {
      /* noop */
    }
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      if (orientationRef) orientationRef.removeEventListener("change", update);
    };
  }, []);
  return display;
}

function useIpInfo() {
  const [state, setState] = useState({ status: "loading", data: null });
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    async function fromIpwho() {
      const res = await fetch("https://ipwho.is/", { signal: controller.signal });
      if (!res.ok) throw new Error("bad response");
      const j = await res.json();
      if (j && j.success === false) throw new Error("lookup failed");
      return {
        ip: j.ip || null,
        city: j.city || null,
        region: j.region || null,
        country: j.country || null,
        isp: (j.connection && (j.connection.isp || j.connection.org)) || null,
        timezone: (j.timezone && j.timezone.id) || null,
      };
    }

    async function fromIpapi() {
      const res = await fetch("https://ipapi.co/json/", { signal: controller.signal });
      if (!res.ok) throw new Error("bad response");
      const j = await res.json();
      if (j && j.error) throw new Error("lookup failed");
      return {
        ip: j.ip || null,
        city: j.city || null,
        region: j.region || null,
        country: j.country_name || null,
        isp: j.org || null,
        timezone: j.timezone || null,
      };
    }

    (async () => {
      try {
        const data = await fromIpwho();
        if (!cancelled) setState({ status: "ok", data });
      } catch (e1) {
        try {
          const data = await fromIpapi();
          if (!cancelled) setState({ status: "ok", data });
        } catch (e2) {
          if (!cancelled) setState({ status: "error", data: null });
        }
      } finally {
        clearTimeout(timeoutId);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, []);
  return state;
}

/* ------------------------------ presentational ---------------------------- */

function StatusDot({ online }) {
  return <span className={`yff-dot ${online ? "is-online" : "is-offline"}`} aria-hidden="true" />;
}

function PanelLabel({ children }) {
  return <span className="yff-panel-label">{children}</span>;
}

function DataRow({ label, value }) {
  return (
    <div className="yff-row">
      <span className="yff-row-label">{label}</span>
      <span className="yff-row-leader" aria-hidden="true" />
      <span className="yff-row-value">{value}</span>
    </div>
  );
}

function StripItem({ label, value }) {
  return (
    <div className="yff-strip-item">
      <span className="yff-strip-label">{label}</span>
      <span className="yff-strip-value">{value}</span>
    </div>
  );
}

function PanelSection({ index, title, accent, className, children }) {
  return (
    <section className={`yff-section yff-accent-${accent} ${className || ""}`}>
      <div className="yff-section-head">
        <span className="yff-section-index">{index}</span>
        <span className="yff-section-title">{title}</span>
      </div>
      <div className="yff-section-body">{children}</div>
    </section>
  );
}

function TransitionSweep() {
  return (
    <div className="yff-sweep" aria-hidden="true">
      <span className="yff-sweep-bar" />
    </div>
  );
}

/* --------------------------------- landing -------------------------------- */

function Landing({ onEnter }) {
  const online = useOnlineStatus();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  const revCode = useMemo(() => {
    const d = new Date();
    return `REV.${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}`;
  }, []);

  return (
    <main className={`yff-landing ${visible ? "is-visible" : ""}`}>
      <div className="yff-frame" aria-hidden="true">
        <span className="corner tl" />
        <span className="corner tr" />
        <span className="corner bl" />
        <span className="corner br" />
      </div>
      <div className="yff-scanline" aria-hidden="true" />

      <div className="yff-eyebrow-row">
        <span className="yff-tag">NODE 01 — ENVIRONMENT SCAN</span>
        <span className="yff-tag yff-tag-right">{revCode}</span>
      </div>

      <div className="yff-hero">
        <h1 className="yff-title">CYBERDAEMON 2026</h1>
        <div className="yff-subtitle-row">
          <span className="yff-rule" />
          <h2 className="yff-subtitle">CONTROL PANEL</h2>
          <span className="yff-rule" />
        </div>
        <p className="yff-desc">
          A website made to demonstrate what a browser legitimately exposes about your device and environment without any permission. Made by B4blad3_L3g._nd
        </p>
        <button type="button" className="yff-enter-btn" onClick={onEnter}>
          <span>ENTER CONTROL PANEL</span>
          <span className="yff-btn-arrow" aria-hidden="true">→</span>
        </button>
      </div>

      <div className="yff-landing-footer">
        <span className="yff-vertical-label">SYSTEM</span>
        <span className="yff-signal">
          <StatusDot online={online} />
          {online ? "SIGNAL — ONLINE" : "SIGNAL — OFFLINE"}
        </span>
        <span className="yff-credit">
          MADE BY BABLADÉ LEGEND <em>//</em> BABLADÉ STUDIOS
        </span>
      </div>
    </main>
  );
}

/* ------------------------------ control panel ------------------------------ */

function ControlPanel({ onExit }) {
  const now = useClock();
  const online = useOnlineStatus();
  const device = useStaticDeviceInfo();
  const display = useDisplayInfo();
  const network = useIpInfo();
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const prefersLight = useMediaQuery("(prefers-color-scheme: light)");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const tz = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "NOT EXPOSED";
    } catch (e) {
      return "NOT EXPOSED";
    }
  }, []);

  const colorScheme = prefersDark ? "DARK" : prefersLight ? "LIGHT" : "NOT SPECIFIED";
  const time = { h: pad2(now.getHours()), m: pad2(now.getMinutes()), s: pad2(now.getSeconds()) };

  return (
    <main className={`yff-panel ${visible ? "is-visible" : ""}`}>
      <div className="yff-scanline yff-scanline-panel" aria-hidden="true" />

      <header className="yff-panel-header">
        <div className="yff-brand">
          <span className="yff-brand-main">CYBERDAEMON 2026</span>
          <span className="yff-brand-sub">CONTROL PANEL</span>
        </div>
        <div className="yff-header-right">
          <span className="yff-signal">
            <StatusDot online={online} />
            {online ? "ONLINE" : "OFFLINE"}
          </span>
          <button type="button" className="yff-exit-btn" onClick={onExit}>
            ‹ EXIT
          </button>
        </div>
      </header>

      <section className="yff-clock-block" aria-label="Local time">
        <div className="yff-clock">
          <span>{time.h}</span>
          <span className="yff-colon">:</span>
          <span>{time.m}</span>
          <span className="yff-colon">:</span>
          <span className="yff-seconds">{time.s}</span>
        </div>
        <div className="yff-clock-meta">
          <span>{tz !== "NOT EXPOSED" ? tz.replace(/_/g, " ").toUpperCase() : tz}</span>
          <span className="dot-sep">·</span>
          <span>{formatOffset(now)}</span>
          <span className="dot-sep">·</span>
          <span>{formatDate(now)}</span>
        </div>
      </section>

      <div className="yff-grid">
        <PanelSection index="01" title="LOCAL SYSTEM" accent="blue" className="yff-panel-local">
          <div className="yff-subgroup">
            <PanelLabel>DEVICE</PanelLabel>
            <DataRow label="PLATFORM" value={device.os} />
            <DataRow label="BROWSER" value={device.browser} />
            <DataRow label="CPU CORES" value={device.cores ? `${device.cores}` : "NOT EXPOSED"} />
            <DataRow
              label="MEMORY"
              value={device.memory ? `${device.memory} GB*` : "NOT EXPOSED"}
            />
            <DataRow label="TOUCH INPUT" value={device.touch ? "SUPPORTED" : "NOT DETECTED"} />
          </div>
          <div className="yff-subgroup">
            <PanelLabel>DISPLAY</PanelLabel>
            <DataRow label="RESOLUTION" value={`${display.sw} × ${display.sh}`} />
            <DataRow label="VIEWPORT" value={`${display.vw} × ${display.vh}`} />
            <DataRow label="PIXEL RATIO" value={`${display.dpr}×`} />
            <DataRow label="ORIENTATION" value={display.orientation} />
          </div>
        </PanelSection>

        <PanelSection index="02" title="NETWORK" accent="red" className="yff-panel-network">
          {network.status === "loading" && (
            <p className="yff-scanning">SCANNING NETWORK…</p>
          )}
          {network.status === "error" && (
            <p className="yff-unavailable">NETWORK LOOKUP UNAVAILABLE</p>
          )}
          {network.status === "ok" && (
            <>
              <DataRow label="IP ADDRESS" value={network.data.ip || "NOT EXPOSED"} />
              <DataRow
                label="LOCATION"
                value={
                  [network.data.city, network.data.region, network.data.country]
                    .filter(Boolean)
                    .join(", ") || "NOT EXPOSED"
                }
              />
              <DataRow label="ISP / ORG" value={network.data.isp || "NOT EXPOSED"} />
              <DataRow label="NETWORK TZ" value={network.data.timezone || "NOT EXPOSED"} />
            </>
          )}
          <p className="yff-footnote">
            * APPROXIMATE, VIA PUBLIC IP LOOKUP. NOT A PRECISE LOCATION.
          </p>
        </PanelSection>
      </div>

      <section className="yff-strip" aria-label="Environment">
        <PanelLabel>03 — ENVIRONMENT</PanelLabel>
        <div className="yff-strip-row">
          <StripItem label="LANGUAGE" value={device.language} />
          <StripItem label="COLOR SCHEME" value={colorScheme} />
          <StripItem label="WEBGL" value={device.webgl ? "AVAILABLE" : "UNAVAILABLE"} />
          <StripItem label="CONNECTION" value={online ? "ONLINE" : "OFFLINE"} />
        </div>
      </section>

      <footer className="yff-panel-footer">
        <span className="yff-credit">
          MADE BY BABLADÉ LEGEND <em>//</em> BABLADÉ STUDIOS
        </span>
        <span className="yff-privacy-note">
          PRIVACY-AWARENESS DEMO — DATA READ LOCALLY, NOTHING STORED
        </span>
      </footer>
    </main>
  );
}

/* ----------------------------------- app ----------------------------------- */

export default function App() {
  const [entered, setEntered] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const handleEnter = useCallback(() => {
    if (transitioning) return;
    setTransitioning(true);
    const revealDelay = reducedMotion ? 0 : 650;
    const clearDelay = reducedMotion ? 0 : 1000;
    window.setTimeout(() => {
      setEntered(true);
      window.scrollTo({ top: 0 });
    }, revealDelay);
    window.setTimeout(() => setTransitioning(false), clearDelay);
  }, [transitioning, reducedMotion]);

  const handleExit = useCallback(() => {
    setEntered(false);
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className={`yff-root ${reducedMotion ? "yff-reduced" : ""}`}>
      <style>{STYLES}</style>
      <div className="yff-bg" aria-hidden="true" />
      {!entered && <Landing onEnter={handleEnter} />}
      {entered && <ControlPanel onExit={handleExit} />}
      {transitioning && <TransitionSweep />}
    </div>
  );
}

/* ---------------------------------- styles ---------------------------------- */

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');

.yff-root {
  --bg: #060708;
  --line: rgba(255,255,255,0.10);
  --line-soft: rgba(255,255,255,0.06);
  --blue: #3fa2ff;
  --blue-soft: rgba(63,162,255,0.16);
  --blue-glow: rgba(63,162,255,0.35);
  --red: #ff3b4e;
  --red-soft: rgba(255,59,78,0.16);
  --red-glow: rgba(255,59,78,0.35);
  --text: #eef1f5;
  --text-dim: #8089c;
  --text-dim: #7d8792;
  --text-faint: #454c54;
  --font-display: 'Chakra Petch', 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, monospace;
  --ease: cubic-bezier(.16,.8,.24,1);
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-mono);
  overflow-x: hidden;
  isolation: isolate;
}
.yff-root, .yff-root *, .yff-root *::before, .yff-root *::after { box-sizing: border-box; }
.yff-root button { font: inherit; }
.yff-root a:focus-visible, .yff-root button:focus-visible { outline: 2px solid var(--blue); outline-offset: 3px; }

.yff-bg {
  position: fixed; inset: 0; z-index: 0; pointer-events: none;
  background:
    radial-gradient(ellipse 60% 50% at 50% -10%, rgba(63,162,255,0.10), transparent 60%),
    radial-gradient(ellipse 50% 40% at 100% 110%, rgba(255,59,78,0.08), transparent 60%),
    repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 48px),
    repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 48px),
    var(--bg);
}

.yff-scanline {
  position: absolute; left: 0; right: 0; top: -120px; height: 120px; pointer-events: none; z-index: 1;
  background: linear-gradient(to bottom, transparent, rgba(63,162,255,0.06), transparent);
  animation: yff-scan 9s linear infinite;
  mix-blend-mode: screen;
}
.yff-scanline-panel { animation-duration: 14s; }
@keyframes yff-scan { 0% { top: -120px; } 100% { top: 100%; } }

@keyframes yff-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
@keyframes yff-blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: .25; } }

/* ---------- landing ---------- */

.yff-landing {
  position: relative; z-index: 2;
  min-height: 100vh; min-height: 100dvh;
  display: flex; flex-direction: column; justify-content: space-between;
  padding: clamp(20px, 4vw, 48px);
  opacity: 0; transform: translateY(10px);
  transition: opacity .8s var(--ease), transform .8s var(--ease);
}
.yff-landing.is-visible { opacity: 1; transform: none; }

.yff-frame { position: absolute; inset: clamp(14px, 2.4vw, 28px); pointer-events: none; z-index: 1; }
.corner { position: absolute; width: 22px; height: 22px; }
.corner.tl { top: 0; left: 0; border-top: 1px solid var(--line); border-left: 1px solid var(--line); }
.corner.tr { top: 0; right: 0; border-top: 1px solid var(--line); border-right: 1px solid var(--line); }
.corner.bl { bottom: 0; left: 0; border-bottom: 1px solid var(--line); border-left: 1px solid var(--line); }
.corner.br { bottom: 0; right: 0; border-bottom: 1px solid var(--line); border-right: 1px solid var(--line); }

.yff-eyebrow-row {
  position: relative; z-index: 2; display: flex; justify-content: space-between; align-items: center;
  font-family: var(--font-mono); font-size: 11px; letter-spacing: .14em; color: var(--text-dim);
}
.yff-tag { display: inline-flex; align-items: center; gap: 8px; }
.yff-tag::before {
  content: ''; width: 5px; height: 5px; border-radius: 50%;
  background: var(--blue); box-shadow: 0 0 8px var(--blue-glow);
}
.yff-tag-right::before { background: var(--red); box-shadow: 0 0 8px var(--red-glow); }

.yff-hero {
  position: relative; z-index: 2; margin: auto 0; text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: clamp(14px, 2vw, 22px);
}
.yff-title {
  font-family: var(--font-display); font-weight: 700; text-transform: uppercase;
  font-size: clamp(2.5rem, 9vw, 7rem); line-height: .95; letter-spacing: .01em; margin: 0;
  background: linear-gradient(180deg, #ffffff 0%, #c9d3dc 55%, #8b97a3 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.yff-subtitle-row { display: flex; align-items: center; gap: clamp(10px, 2vw, 22px); width: 100%; max-width: 620px; }
.yff-rule { flex: 1; height: 1px; background: linear-gradient(90deg, transparent, var(--line), transparent); }
.yff-subtitle {
  font-family: var(--font-display); font-weight: 500; font-size: clamp(.95rem, 2.2vw, 1.35rem);
  letter-spacing: .5em; padding-left: .5em; color: var(--text-dim); margin: 0; text-transform: uppercase;
}
.yff-desc { max-width: 480px; font-family: var(--font-mono); font-size: 12.5px; line-height: 1.6; color: var(--text-dim); margin: 0; }

.yff-enter-btn {
  margin-top: 8px; position: relative; display: inline-flex; align-items: center; gap: 12px;
  padding: 16px 30px; background: transparent; border: 1px solid var(--blue); color: var(--text);
  font-family: var(--font-display); font-weight: 600; font-size: 13px; letter-spacing: .18em;
  text-transform: uppercase; cursor: pointer;
  clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px));
  transition: color .3s var(--ease), box-shadow .3s var(--ease), transform .2s var(--ease);
}
.yff-enter-btn::before {
  content: ''; position: absolute; inset: 0; background: var(--blue); opacity: 0; z-index: -1;
  clip-path: inherit; transition: opacity .3s var(--ease);
}
.yff-enter-btn:hover, .yff-enter-btn:focus-visible { color: #04070a; box-shadow: 0 0 30px var(--blue-glow); transform: translateY(-1px); }
.yff-enter-btn:hover::before, .yff-enter-btn:focus-visible::before { opacity: 1; }
.yff-btn-arrow { transition: transform .3s var(--ease); }
.yff-enter-btn:hover .yff-btn-arrow { transform: translateX(4px); }

.yff-landing-footer {
  position: relative; z-index: 2; display: flex; align-items: center; justify-content: space-between;
  gap: 16px; font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .12em; color: var(--text-faint);
}
.yff-vertical-label { writing-mode: vertical-rl; text-orientation: mixed; letter-spacing: .3em; color: var(--text-faint); }
.yff-signal { display: inline-flex; align-items: center; gap: 8px; color: var(--text-dim); white-space: nowrap; }
.yff-dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; flex: none; }
.yff-dot.is-online { background: var(--blue); box-shadow: 0 0 10px var(--blue-glow); animation: yff-pulse 2.4s ease-in-out infinite; }
.yff-dot.is-offline { background: var(--red); box-shadow: 0 0 10px var(--red-glow); }
.yff-credit { color: var(--text-faint); text-align: right; }
.yff-credit em { color: var(--red); font-style: normal; }

/* ---------- transition sweep ---------- */

.yff-sweep { position: fixed; inset: 0; z-index: 50; pointer-events: none; overflow: hidden; }
.yff-sweep-bar {
  position: absolute; top: 0; bottom: 0; width: 16%; left: -22%;
  background: linear-gradient(90deg, transparent, rgba(63,162,255,.4), rgba(255,59,78,.4), transparent);
  filter: blur(2px);
  animation: yff-sweep-move .9s var(--ease) forwards;
}
@keyframes yff-sweep-move { 0% { left: -22%; } 100% { left: 112%; } }

/* ---------- control panel ---------- */

.yff-panel {
  position: relative; z-index: 2; min-height: 100vh; min-height: 100dvh;
  padding: clamp(16px, 3vw, 40px); display: flex; flex-direction: column; gap: clamp(20px, 3vw, 34px);
  opacity: 0; transform: translateY(10px); transition: opacity .7s var(--ease), transform .7s var(--ease);
}
.yff-panel.is-visible { opacity: 1; transform: none; }

.yff-panel-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-bottom: 14px; border-bottom: 1px solid var(--line); }
.yff-brand { display: flex; flex-direction: column; line-height: 1.15; }
.yff-brand-main { font-family: var(--font-display); font-weight: 700; font-size: clamp(13px, 2vw, 16px); letter-spacing: .08em; }
.yff-brand-sub { font-family: var(--font-mono); font-size: 10px; letter-spacing: .3em; color: var(--text-dim); }
.yff-header-right { display: flex; align-items: center; gap: 18px; }
.yff-exit-btn {
  background: transparent; border: 1px solid var(--line); color: var(--text-dim);
  font-family: var(--font-mono); font-size: 11px; letter-spacing: .1em; padding: 8px 14px; cursor: pointer;
  transition: border-color .25s var(--ease), color .25s var(--ease), box-shadow .25s var(--ease);
}
.yff-exit-btn:hover, .yff-exit-btn:focus-visible { border-color: var(--red); color: var(--text); box-shadow: 0 0 16px var(--red-soft); }

.yff-clock-block { text-align: center; padding: clamp(8px, 3vw, 18px) 0; }
.yff-clock {
  font-family: var(--font-mono); font-weight: 700; font-size: clamp(2.8rem, 12vw, 7rem);
  letter-spacing: .02em; display: inline-flex; gap: 2px; color: #fff;
  text-shadow: 0 0 40px rgba(63,162,255,.25); font-variant-numeric: tabular-nums;
}
.yff-colon { color: var(--blue); animation: yff-blink 1s steps(1) infinite; }
.yff-seconds { color: var(--red); }
.yff-clock-meta {
  margin-top: 10px; font-family: var(--font-mono); font-size: 11.5px; letter-spacing: .12em; color: var(--text-dim);
  display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;
}
.dot-sep { color: var(--text-faint); }

.yff-grid { display: grid; grid-template-columns: 1.35fr 1fr; gap: 1px; background: var(--line); border: 1px solid var(--line); }
.yff-section { background: var(--bg); padding: 22px clamp(16px, 2.4vw, 28px); position: relative; }
.yff-section-head { display: flex; align-items: baseline; gap: 10px; margin-bottom: 16px; }
.yff-section-index { font-family: var(--font-mono); font-size: 11px; color: var(--text-faint); }
.yff-section-title { font-family: var(--font-display); font-weight: 600; font-size: 12.5px; letter-spacing: .2em; }
.yff-accent-blue .yff-section-title { color: var(--blue); }
.yff-accent-red .yff-section-title { color: var(--red); }
.yff-accent-blue { box-shadow: inset 3px 0 0 var(--blue); }
.yff-accent-red { box-shadow: inset 3px 0 0 var(--red); }
.yff-panel-local { clip-path: polygon(0 0, 100% 0, 100% 100%, 18px 100%, 0 calc(100% - 18px)); }
.yff-panel-network { clip-path: polygon(18px 0, 100% 0, 100% calc(100% - 18px), calc(100% - 18px) 100%, 0 100%, 0 18px); }

.yff-subgroup + .yff-subgroup { margin-top: 18px; padding-top: 18px; border-top: 1px dashed var(--line-soft); }
.yff-panel-label { display: block; font-family: var(--font-mono); font-size: 10px; letter-spacing: .25em; color: var(--text-faint); margin-bottom: 10px; }

.yff-row { display: flex; align-items: baseline; gap: 10px; padding: 6px 0; font-size: 12.5px; }
.yff-row-label { color: var(--text-dim); letter-spacing: .08em; white-space: nowrap; }
.yff-row-leader { flex: 1; border-bottom: 1px dotted var(--line); transform: translateY(-3px); }
.yff-row-value { color: var(--text); font-weight: 500; white-space: nowrap; text-align: right; transition: color .2s var(--ease); }
.yff-row:hover .yff-row-value { color: var(--blue); }
.yff-accent-red .yff-row:hover .yff-row-value { color: var(--red); }

.yff-scanning, .yff-unavailable { font-size: 12px; letter-spacing: .08em; }
.yff-scanning { color: var(--text-dim); animation: yff-pulse 1.6s ease-in-out infinite; }
.yff-unavailable { color: var(--red); }
.yff-footnote { margin-top: 14px; font-size: 9.5px; color: var(--text-faint); letter-spacing: .05em; }

.yff-strip { border: 1px solid var(--line); padding: 18px clamp(16px, 2.4vw, 28px); }
.yff-strip-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 6px; }
.yff-strip-item { display: flex; flex-direction: column; gap: 6px; padding-left: 14px; border-left: 1px solid var(--line); transition: border-color .2s var(--ease); }
.yff-strip-item:hover { border-color: var(--blue); }
.yff-strip-label { font-size: 10px; letter-spacing: .2em; color: var(--text-faint); }
.yff-strip-value { font-size: 13px; color: var(--text); font-weight: 600; }

.yff-panel-footer {
  display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
  padding-top: 14px; border-top: 1px solid var(--line); font-size: 10px; letter-spacing: .1em; color: var(--text-faint);
}

/* ---------- responsive ---------- */

@media (max-width: 900px) {
  .yff-grid { grid-template-columns: 1fr; }
  .yff-panel-local, .yff-panel-network { clip-path: none; }
  .yff-strip-row { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 640px) {
  .yff-eyebrow-row { font-size: 9.5px; }
  .yff-frame { display: none; }
  .yff-landing-footer { flex-direction: column; align-items: flex-start; gap: 10px; }
  .yff-vertical-label { display: none; }
  .yff-credit { text-align: left; }
  .yff-header-right { gap: 10px; }
  .yff-row { flex-wrap: wrap; }
  .yff-row-leader { display: none; }
  .yff-row-value { text-align: left; }
  .yff-strip-row { grid-template-columns: 1fr 1fr; }
  .yff-panel-footer { flex-direction: column; align-items: flex-start; gap: 6px; }
}

/* ---------- reduced motion ---------- */

.yff-reduced .yff-scanline,
.yff-reduced .yff-dot.is-online,
.yff-reduced .yff-colon,
.yff-reduced .yff-sweep-bar,
.yff-reduced .yff-scanning {
  animation: none !important;
}
.yff-reduced .yff-landing,
.yff-reduced .yff-panel {
  transition: none !important;
}
`;