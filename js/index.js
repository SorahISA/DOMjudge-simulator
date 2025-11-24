"use strict";

function toLocalInputValue(iso) {
  if (!iso) return "";
  const dt = new Date(iso);
  const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function handleTeamForm(event) {
  event.preventDefault();
  const name = document.getElementById("team-name").value.trim();
  const aff = document.getElementById("team-affil").value.trim();
  DJState.setMyTeam(name || "My Team", aff || "Local University");
  alert("Team saved.");
}

function handleContestForm(event) {
  event.preventDefault();
  const start = document.getElementById("contest-start").value;
  if (start) {
    DJState.setContestStart(new Date(start).toISOString());
    alert("Contest start time saved.");
  }
}

function handleImport(event) {
  event.preventDefault();
  const raw = document.getElementById("contest-json").value.trim();
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.contestant) {
      DJState.importContestFormat(parsed);
    } else {
      DJState.importContest(parsed);
    }
    alert("Contest imported.");
  } catch (err) {
    alert("Invalid JSON");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const teamForm = document.getElementById("team-form");
  if (teamForm) teamForm.addEventListener("submit", handleTeamForm);

  const contestForm = document.getElementById("contest-form");
  if (contestForm) contestForm.addEventListener("submit", handleContestForm);

  const importForm = document.getElementById("import-form");
  if (importForm) importForm.addEventListener("submit", handleImport);

  const fileBtn = document.getElementById("import-file-btn");
  const fileInput = document.getElementById("contest-file");
  const exportBtn = document.getElementById("export-file");
  const copyBtn = document.getElementById("copy-clipboard");
  if (fileBtn && fileInput) {
    fileBtn.addEventListener("click", () => {
      const file = fileInput.files && fileInput.files[0];
      if (!file) {
        alert("Please choose a JSON file.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          if (parsed && parsed.contestant) {
            DJState.importContestFormat(parsed);
          } else {
            DJState.importContest(parsed);
          }
          alert("Contest imported.");
        } catch (err) {
          alert("Invalid JSON file.");
        }
      };
      reader.readAsText(file);
    });
  }
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      const state = DJState.loadState();
      const data = DJState.exportContestFormat(state);
      const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "contest.json";
      a.click();
      URL.revokeObjectURL(url);
    });
  }
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      const state = DJState.loadState();
      const data = DJState.exportContestFormat(state);
      try {
        await navigator.clipboard.writeText(JSON.stringify(data));
        alert("Copied to clipboard.");
      } catch (err) {
        alert("Failed to copy.");
      }
    });
  }

  // Prefill existing state
  const state = DJState.loadState();
  document.getElementById("team-name").value = state.myTeam.name;
  document.getElementById("team-affil").value = state.myTeam.affiliation;
  if (state.contest.startTime) {
    document.getElementById("contest-start").value = toLocalInputValue(state.contest.startTime);
  }
});
