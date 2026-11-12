// Standalone web launcher. Load this module once on a page; it loads the shared
// swarm engine only after the visitor presses the floating button.
const mount = () => {
  if (document.querySelector("[data-swarm-launcher]")) return;

  const host = document.createElement("div");
  host.setAttribute("data-swarm-launcher", "");
  host.style.cssText = "all:initial !important;position:fixed !important;right:max(20px,env(safe-area-inset-right)) !important;bottom:max(20px,env(safe-area-inset-bottom)) !important;width:60px !important;height:60px !important;z-index:2147483647 !important;display:block !important;pointer-events:auto !important;";
  const root = host.attachShadow({ mode: "closed" });
  root.innerHTML = `<style>
    *{box-sizing:border-box}
    button{display:grid;place-items:center;width:60px;height:60px;padding:0;border:1px solid rgba(255,255,255,.2);border-radius:50%;background:#202124;color:#fff;box-shadow:0 8px 28px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.14);cursor:pointer;transition:transform .18s ease,box-shadow .18s ease,background .18s ease}
    button:hover{transform:translateY(-3px);background:#30333a;box-shadow:0 12px 34px rgba(0,0,0,.32)}
    button:active{transform:scale(.96)}
    button:focus-visible{outline:3px solid #0D99FF;outline-offset:4px}
    button:disabled{opacity:.65;cursor:wait}
    button.running,button.running:hover{background:#000}
    svg{width:35px;height:35px;overflow:visible}
    .close-icon{display:none;width:25px;height:25px}
    button.running .launch-icon{display:none}
    button.running .close-icon{display:block}
    @media(prefers-reduced-motion:reduce){button{transition:none}}
  </style>
  <button type="button" aria-label="Run Swarm Rebuild" title="Run Swarm Rebuild">
    <svg class="launch-icon" viewBox="0 0 36 36" aria-hidden="true">
      <path d="M5 4.5 5.3 21l4-4.3 3.1 7.5 3.5-1.5-3.1-7.4 5.9-.3Z" fill="#0D99FF" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"/>
      <path d="M20 8.5 20.3 25l4-4.3 3.1 7.5 3.5-1.5-3.1-7.4 5.9-.3Z" fill="#A259FF" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"/>
    </svg>
    <svg class="close-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6 18 18 M18 6 6 18" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>
  </button>`;
  const button = root.querySelector("button");
  const setRunning = (active, closing = false) => {
    button.classList.toggle("running", active);
    button.disabled = closing;
    button.setAttribute("aria-label", active ? "Stop Swarm Rebuild" : "Run Swarm Rebuild");
    button.title = active ? "Stop Swarm Rebuild" : "Run Swarm Rebuild";
  };
  window.addEventListener("swarm-cursors:state", (e) => setRunning(e.detail.active, e.detail.closing));
  button.addEventListener("click", async () => {
    if (window.__swarmRebuild?.active) {
      window.__swarmRebuild.stop(false);
      return;
    }
    button.disabled = true;
    try {
      if (!window.__swarmRebuild) {
        window.__swarmDeferStart = true;
        window.__swarmWebMode = true;
        await import("./swarm.js");
      }
      window.__swarmRebuild.start();
    } catch (err) {
      console.error("[swarm-cursors] could not start", err);
      button.title = "Swarm Rebuild could not start on this page";
      setRunning(false);
    } finally {
      if (!button.classList.contains("running")) button.disabled = false;
    }
  });
  document.documentElement.appendChild(host);
};

if (document.documentElement) mount();
else document.addEventListener("DOMContentLoaded", mount, { once: true });
