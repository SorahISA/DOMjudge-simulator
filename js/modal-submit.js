"use strict";

const SUBMIT_LANGS = ["C++", "C", "Java", "Python", "Kotlin"];

function currentContestTimeSeconds(state) {
  if (!state.contest.startTime) return 0;
  const start = new Date(state.contest.startTime).getTime();
  const now = Date.now();
  const elapsed = Math.max(0, (now - start) / 1000);
  return Math.min(state.contest.lengthSeconds, Math.floor(elapsed));
}

function ensureSubmitModal() {
  if (document.getElementById("submitModal")) return;
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div class="modal fade" id="submitModal" tabindex="-1" aria-labelledby="submitModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="submitModalLabel">Submit</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form id="modal-submit-form">
              <div class="mb-3">
                <label class="form-label" for="modal-submit-problem">Problem</label>
                <select class="form-select" id="modal-submit-problem" required></select>
              </div>
              <div class="mb-3">
                <label class="form-label" for="modal-submit-lang">Language</label>
                <select class="form-select" id="modal-submit-lang" required></select>
              </div>
              <div class="mb-3">
                <label class="form-label" for="modal-submit-result">Result</label>
              <select class="form-select" id="modal-submit-result" required>
                <option value="correct">correct</option>
                <option value="wrong-answer">wrong-answer</option>
                <option value="timelimit">timelimit</option>
                <option value="run-error">run-error</option>
                <option value="compiler-error">compiler-error</option>
                <option value="no-output">no-output</option>
                <option value="output-limit">output-limit</option>
                <option value="rejected">rejected</option>
              </select>
              </div>
              <div class="text-end">
                <button type="submit" class="btn btn-success">Submit</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(wrapper.firstElementChild);
}

function populateModalOptions() {
  const problemSelect = document.getElementById("modal-submit-problem");
  const langSelect = document.getElementById("modal-submit-lang");
  if (!problemSelect || !langSelect) return;
  const state = DJState.loadState();
  problemSelect.innerHTML =
    `<option value="" disabled selected>Select a problem</option>` +
    state.problems
      .map((p, idx) => {
        const short = p.short || p.id || `P${idx + 1}`;
        const name = p.name || short;
        return `<option value="${p.id}">${short} - ${name}</option>`;
      })
      .join("");
  langSelect.innerHTML = SUBMIT_LANGS.map((l, idx) => `<option value="${l}"${idx === 0 ? " selected" : ""}>${l}</option>`).join("");
}

function handleModalSubmit(event) {
  event.preventDefault();
  const problem = document.getElementById("modal-submit-problem").value;
  const lang = document.getElementById("modal-submit-lang").value;
  const result = document.getElementById("modal-submit-result").value;
  if (!problem || !lang || !result) return;
  const state = DJState.loadState();
  const time = currentContestTimeSeconds(state);
  DJState.addSubmission(state.myTeam.id, problem, result, time, lang);
  if (typeof renderHome === "function") {
    renderHome();
  }
  window.location.href = "home.html";
  const modalEl = document.getElementById("submitModal");
  if (modalEl) {
    const inst = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
    inst.hide();
  }
}

function setupSubmitModal() {
  ensureSubmitModal();
  populateModalOptions();
  const form = document.getElementById("modal-submit-form");
  if (form && !form.dataset.bound) {
    form.addEventListener("submit", handleModalSubmit);
    form.dataset.bound = "true";
  }
}

function showSubmitModal() {
  setupSubmitModal();
  const modalEl = document.getElementById("submitModal");
  if (!modalEl) return;
  const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
  modal.show();
}

window.DJSubmitModal = {
  showSubmitModal,
  setupSubmitModal
};
