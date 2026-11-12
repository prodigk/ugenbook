// Standalone web launcher. Load this module once on a page; it loads the shared
// swarm engine only after the visitor presses the floating button.
const mount = () => {
  if (document.querySelector("[data-swarm-launcher]")) return;

  const host = document.createElement("div");
  host.setAttribute("data-swarm-launcher", "");
  host.style.cssText = "all:initial !important;position:fixed !important;right:max(20px,env(safe-area-inset-right)) !important;bottom:max(20px,env(safe-area-inset-bottom)) !important;width:60px !important;height:60px !important;z-index:2147483646 !important;display:block !important;pointer-events:auto !important;";
  const root = host.attachShadow({ mode: "closed" });
  root.innerHTML = `<style>
    *{box-sizing:border-box}
    button{display:grid;place-items:center;width:60px;height:60px;padding:0;border:1px solid rgba(255,255,255,.2);border-radius:50%;background:#202124;color:#fff;box-shadow:0 8px 28px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.14);cursor:pointer;transition:transform .18s ease,box-shadow .18s ease,background .18s ease}
    button:hover{transform:translateY(-3px);background:#30333a;box-shadow:0 12px 34px rgba(0,0,0,.32)}
    button:active{transform:scale(.96)}
    button:focus-visible{outline:3px solid #0D99FF;outline-offset:4px}
    button:disabled{opacity:.65;cursor:wait}
    svg{width:35px;height:35px;overflow:visible}
    @media(prefers-reduced-motion:reduce){button{transition:none}}
  </style>
  <button type="button" aria-label="Run Swarm Rebuild" title="Run Swarm Rebuild">
    <svg viewBox="0 0 36 36" aria-hidden="true">
      <path d="M5 4.5 5.3 21l4-4.3 3.1 7.5 3.5-1.5-3.1-7.4 5.9-.3Z" fill="#0D99FF" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"/>
      <path d="M20 8.5 20.3 25l4-4.3 3.1 7.5 3.5-1.5-3.1-7.4 5.9-.3Z" fill="#A259FF" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"/>
    </svg>
  </button>`;
  const button = root.querySelector("button");
  button.addEventListener("click", async () => {
    button.disabled = true;
    try {
      if (!window.__swarmRebuild) {
        window.__swarmDeferStart = true;
        await import("./swarm.js");
      }
      window.__swarmRebuild.start();
    } catch (err) {
      console.error("[swarm-cursors] could not start", err);
      button.title = "Swarm Rebuild could not start on this page";
    } finally {
      button.disabled = false;
    }
  });
  document.documentElement.appendChild(host);
};

if (document.documentElement) mount();
else document.addEventListener("DOMContentLoaded", mount, { once: true });
