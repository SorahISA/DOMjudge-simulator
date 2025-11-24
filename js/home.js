"use strict";

function isCorrect(result) {
  return (result || "").toLowerCase() === "correct";
}

function renderHome() {
  const state = DJState.loadState();
  const myTeam = state.teams.find((t) => t.id === state.myTeam.id) || state.myTeam;
  const submissions = (myTeam.submissions || []).slice().sort((a, b) => b.time - a.time);
  const list = document.getElementById("submission-list");
  if (list) {
    list.innerHTML = submissions
      .map((s) => {
        const prob = state.problems.find((p) => p.id === s.problem);
        const color = prob?.color || "#f5f5f5";
        const border = prob?.border || color;
        const textColor = textColorForHex(color);
        return `<tr>
          <td><a>${DJCommon.formatHHMMSS(s.time)}</a></td>
          <td class="probid">
            <a title="${s.problem}">
              <span class="badge problem-badge" style="background-color: ${color}; border: 1px solid ${border}; color:${textColor}"><span>${s.problem}</span></span>
            </a>
          </td>
          <td class="langid"><a title="${s.lang || "C++"}">${(s.lang || "C++").toLowerCase()}</a></td>
          <td><a><span class="sol ${isCorrect(s.result) ? "sol_correct" : "sol_incorrect"}">${(s.result || "").toLowerCase() || "unknown"}</span></a></td>
        </tr>`;
      })
      .join("") || `<tr><td colspan="4" class="text-muted">No submissions yet</td></tr>`;
  }

  renderScoreSummary(state, myTeam);
}

function renderScoreSummary(state, myTeam) {
  const container = document.getElementById("teamscoresummary");
  if (!container) return;
  const tableId = "teamscoretable";
  const expectedProbCols = state.problems.length;
  let table = document.getElementById(tableId);
  const buildTable = () => {
    const colgroups =
      `<colgroup><col id="scoremedal"><col id="scorerank"><col id="scoreflags"><col id="scoreteamname"></colgroup>` +
      `<colgroup><col id="scoresolv"><col id="scoretotal"></colgroup>` +
      `<colgroup>${state.problems.map(() => '<col class="scoreprob">').join("")}</colgroup>`;
    container.innerHTML = `<table id="${tableId}" class="d-none d-md-table scoreboard desktop-scoreboard center ">${colgroups}<thead></thead><tbody></tbody></table>`;
    table = document.getElementById(tableId);
  };
  if (!table || table.querySelectorAll("col.scoreprob").length !== expectedProbCols) {
    buildTable();
  }
  const thead = table.querySelector("thead");
  const tbody = table.querySelector("tbody");
  if (!thead || !tbody) return;
  const headHtml =
    `<tr class="scoreheader" data-static="">
      <th title="rank" scope="col" colspan="2">rank</th>
      <th title="team name" scope="col" colspan="2">team</th>
      <th title="# solved / penalty time" colspan="2" scope="col">score</th>` +
    state.problems
      .map(
        (p) =>
          `<th><span class="badge problem-badge" style="background-color: ${p.color}; border: 1px solid ${p.border || p.color}; color:${textColorForHex(
            p.color
          )};"><span style="color:${textColorForHex(p.color)};">${p.id}</span></span></th>`
      )
      .join("") +
    `</tr>`;
  thead.innerHTML = headHtml;

  const nowSeconds = state.contest.startTime
    ? Math.max(0, Math.floor((Date.now() - new Date(state.contest.startTime).getTime()) / 1000))
    : 0;
  const currentSeconds = Math.min(nowSeconds, state.contest.lengthSeconds);

  const snap = DJScoreboard.computeSnapshot(
    myTeam,
    state.problems,
    currentSeconds,
    state.contest,
    false,
    state.myTeam.id
  );
  const fullRows = state.teams.map((team) =>
    DJScoreboard.computeSnapshot(team, state.problems, currentSeconds, state.contest, state.playback.freezeEnabled, state.myTeam.id)
  );
  fullRows.sort((a, b) => {
    if (b.solved !== a.solved) return b.solved - a.solved;
    if (a.penalty !== b.penalty) return a.penalty - b.penalty;
    return a.name.localeCompare(b.name);
  });
  const ranks = new Map();
  let currentRank = 1;
  fullRows.forEach((team, idx) => {
    if (idx > 0) {
      const prev = fullRows[idx - 1];
      if (team.solved === prev.solved && team.penalty === prev.penalty) {
      } else {
        currentRank = idx + 1;
      }
    }
    ranks.set(team.id, currentRank);
  });
  let selfRank = ranks.get(myTeam.id) || "?";
  if (state.playback.freezeEnabled && currentSeconds >= state.contest.freezeSeconds) {
    selfRank = "?";
  }
  const firstMap =
    DJScoreboard.computeFirstSolves && typeof DJScoreboard.computeFirstSolves === "function"
      ? DJScoreboard.computeFirstSolves(fullRows)
      : {};
  const cells = state.problems
    .map((p) => renderProblemCell(p.id, snap.cells[p.id], firstMap))
    .join("");
  const row = `<tr class="sortorderswitch" data-team-name="${escapeHtml(myTeam.name)}">
    <td class="no-border"></td>
    <td class="scorepl rank">${selfRank}</td>
    <td class="scoreaf cl_FFFFFF"></td>
    <td class="scoretn cl_FFFFFF" title="${escapeHtml(myTeam.name)}">
      <span class="forceWidth">${escapeHtml(myTeam.name)}</span>
      <span class="univ forceWidth">${escapeHtml(myTeam.affiliation || "")}</span>
    </td>
    <td class="scorenc">${snap.solved}</td>
    <td class="scorett">${snap.penalty}</td>
    ${cells}
  </tr>`;
  tbody.innerHTML = row;
}

document.addEventListener("DOMContentLoaded", renderHome);
