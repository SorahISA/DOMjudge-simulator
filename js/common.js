"use strict";

const NAV_TIME_ID = "timeleft";

function formatHHMMSS(seconds) {
  const clamped = Math.max(0, Math.floor(seconds));
  const h = String(Math.floor(clamped / 3600)).padStart(2, "0");
  const m = String(Math.floor((clamped % 3600) / 60)).padStart(2, "0");
  const s = String(clamped % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function computeTimeText(state) {
  const start = state.contest.startTime ? new Date(state.contest.startTime).getTime() : null;
  const now = Date.now();
  if (!start) return "contest over";
  const elapsed = (now - start) / 1000;
  if (elapsed < 0) return `${formatHHMMSS(-elapsed)} to contest start`;
  const remaining = state.contest.lengthSeconds - elapsed;
  if (remaining <= 0) return "contest over";
  return `${formatHHMMSS(remaining)} left`;
}

function initNavTime() {
  const timeEl = document.getElementById(NAV_TIME_ID);
  if (!timeEl) return;
  const state = DJState.loadState();
  timeEl.textContent = computeTimeText(state);
  setInterval(() => {
    const s = DJState.loadState();
    timeEl.textContent = computeTimeText(s);
  }, 1000);
}

function navLinkHandler(event) {
  // Enable Notifications / Logout should go home
  const target = event.target.closest("a[data-go-home]");
  if (target) {
    window.location.href = target.getAttribute("href") || "html/home.html";
    return;
  }
  const submitTarget = event.target.closest("a[data-submit-modal]");
  if (submitTarget) {
    event.preventDefault();
    if (window.DJSubmitModal && typeof window.DJSubmitModal.showSubmitModal === "function") {
      window.DJSubmitModal.showSubmitModal();
    } else {
      window.location.href = submitTarget.getAttribute("href") || "#";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initNavTime();
  document.body.addEventListener("click", navLinkHandler);
});

window.DJCommon = {
  formatHHMMSS
};
