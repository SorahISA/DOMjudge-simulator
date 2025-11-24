"use strict";

let playing = false;
let playbackTimer;
let currentTime = 0;

function updateSpeedLabels(state) {
  const label = document.getElementById("replay-speed-label");
  if (label) {
    label.textContent = `${state.playback.secondsPerTick}s/tick · ${state.playback.ticksPerSecond} tps`;
  }
}

function render(nowSeconds) {
  const state = DJState.loadState();
  updateSpeedLabels(state);
  const slider = document.getElementById("time-slider");
  if (slider) {
    slider.max = state.contest.lengthSeconds;
    slider.value = nowSeconds;
  }
  const timeEl = document.getElementById("current-time");
  const totalEl = document.getElementById("contest-length");
  if (timeEl) timeEl.textContent = DJCommon.formatHHMMSS(nowSeconds);
  if (totalEl) totalEl.textContent = DJCommon.formatHHMMSS(state.contest.lengthSeconds);
  const nameEl = document.getElementById("contest-name");
  if (nameEl) nameEl.textContent = state.contest.name || "Contest";
  DJScoreboard.renderScoreboardTable(state, "scoreboard", nowSeconds);
}

function tick() {
  const state = DJState.loadState();
  const next = currentTime + state.playback.secondsPerTick;
  currentTime = Math.min(next, state.contest.lengthSeconds);
  render(currentTime);
  if (currentTime >= state.contest.lengthSeconds) {
    pause();
  }
}

function play() {
  if (playing) return;
  playing = true;
  const btn = document.getElementById("play-pause");
  if (btn) btn.textContent = "Pause";
  const state = DJState.loadState();
  const interval = 1000 / state.playback.ticksPerSecond;
  playbackTimer = setInterval(tick, interval);
}

function pause() {
  playing = false;
  const btn = document.getElementById("play-pause");
  if (btn) btn.textContent = "Play";
  clearInterval(playbackTimer);
}

function initControls() {
  const playBtn = document.getElementById("play-pause");
  const slider = document.getElementById("time-slider");
  const secondsInput = document.getElementById("seconds-per-tick");
  const tpsInput = document.getElementById("ticks-per-second");
  const freezeBtn = document.getElementById("freeze-toggle");

  if (playBtn) playBtn.addEventListener("click", () => (playing ? pause() : play()));
  if (slider) {
    slider.addEventListener("input", (e) => {
      pause();
      currentTime = Number(e.target.value);
      render(currentTime);
    });
  }
  if (secondsInput) {
    secondsInput.addEventListener("change", (e) => {
      const state = DJState.loadState();
      const val = Math.max(1, Number(e.target.value) || state.playback.secondsPerTick);
      DJState.setPlaybackSettings({ secondsPerTick: val });
      e.target.value = val;
      updateSpeedLabels(DJState.loadState());
    });
  }
  if (tpsInput) {
    tpsInput.addEventListener("change", (e) => {
      const state = DJState.loadState();
      const val = Math.max(1, Number(e.target.value) || state.playback.ticksPerSecond);
      DJState.setPlaybackSettings({ ticksPerSecond: val });
      e.target.value = val;
      updateSpeedLabels(DJState.loadState());
    });
  }
  if (freezeBtn) {
    freezeBtn.addEventListener("click", () => {
      const state = DJState.loadState();
      DJState.setPlaybackSettings({ freezeEnabled: !state.playback.freezeEnabled });
      const next = DJState.loadState();
      freezeBtn.textContent = next.playback.freezeEnabled ? "Freeze ON" : "Freeze OFF";
      render(currentTime);
    });
  }

  // Prefill
  const state = DJState.loadState();
  if (secondsInput) secondsInput.value = state.playback.secondsPerTick;
  if (tpsInput) tpsInput.value = state.playback.ticksPerSecond;
  if (freezeBtn) freezeBtn.textContent = state.playback.freezeEnabled ? "Freeze ON" : "Freeze OFF";
}

document.addEventListener("DOMContentLoaded", () => {
  initControls();
  const state = DJState.loadState();
  const hasStart = !!state.contest.startTime;
  const now = Date.now();
  if (hasStart) {
    const start = new Date(state.contest.startTime).getTime();
    const elapsed = Math.max(0, Math.floor((now - start) / 1000));
    currentTime = Math.min(elapsed, state.contest.lengthSeconds);
    if (now >= start) {
      DJState.setPlaybackSettings({ secondsPerTick: 1, ticksPerSecond: 1 });
      const updated = DJState.loadState();
      const secondsInput = document.getElementById("seconds-per-tick");
      const tpsInput = document.getElementById("ticks-per-second");
      if (secondsInput) secondsInput.value = updated.playback.secondsPerTick;
      if (tpsInput) tpsInput.value = updated.playback.ticksPerSecond;
      updateSpeedLabels(updated);
      render(currentTime);
      play();
      return;
    }
  } else {
    currentTime = 0;
  }
  render(currentTime);
});
