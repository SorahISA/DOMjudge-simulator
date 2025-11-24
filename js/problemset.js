"use strict";

function badgeTextColor(hex) {
  if (!hex) return "#ffffff";
  const value = hex.startsWith("#") ? hex.slice(1) : hex;
  const num = parseInt(value, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 186 ? "#000000" : "#ffffff";
}

function renderProblemset() {
  const state = DJState.loadState();
  const container = document.getElementById("problemset-body");
  if (!container) return;
  container.innerHTML = state.problems
    .map(
      (p, idx) => {
        const color = p.color || "#f5f5f5";
        const border = p.border || color;
        const textColor = badgeTextColor(color);
        return `<div class="col-12 col-lg-4 col-md-6 mb-4">
          <div class="card h-100">
            <div class="card-header">
              <span class="badge problem-badge" style="background-color:${color}; border:1px solid ${border}; color:${textColor}; min-width:18px;">${p.id || p.short || `P${idx + 1}`}</span>
            </div>
            <div class="card-body">
              <h5 class="card-title">${p.name}</h5>
            </div>
            <div class="card-footer d-flex justify-content-between">
              <a href="#" class="btn btn-primary btn-sm">Submit</a>
              <a href="#" class="btn btn-outline-secondary btn-sm">Statement</a>
              <a href="#" class="btn btn-outline-secondary btn-sm">Samples</a>
            </div>
          </div>
        </div>`;
      })
    .join("");
}

document.addEventListener("DOMContentLoaded", renderProblemset);
