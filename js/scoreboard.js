"use strict";

function textColorForHex(hex) {
  if (!hex) return "#ffffff";
  const value = hex.startsWith("#") ? hex.slice(1) : hex;
  const num = parseInt(value, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 186 ? "#000000" : "#ffffff";
}

function escapeHtml(str) {
  return (str || "").replace(/[&<>"']/g, (ch) => {
    switch (ch) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return ch;
    }
  });
}

function isCorrect(result) {
  return (result || "").toLowerCase() === "correct";
}

function computeSnapshot(team, problems, nowSeconds, contest, freezeEnabled, selfId) {
  const state = {};
  problems.forEach((p) => {
    state[p.id] = { attempts: 0, wrong: 0, pending: 0, solved: false, solvedTime: null };
  });

  let solved = 0;
  let penalty = 0;
  const freezeWall = freezeEnabled ? contest.freezeSeconds : contest.lengthSeconds + 1;
  const submissions = (team.submissions || []).slice().sort((a, b) => a.time - b.time);
  const isSelfTeam = selfId && team.id === selfId;

  for (const sub of submissions) {
    const cell = state[sub.problem];
    if (!cell || cell.solved) continue;
    const frozen = sub.time >= freezeWall;
    const preWindow = !frozen && !isSelfTeam && nowSeconds >= sub.time - 30 && nowSeconds < sub.time;

    if (frozen && nowSeconds >= freezeWall && nowSeconds >= sub.time - 30) {
      cell.pending += 1;
      cell.attempts += 1;
      continue;
    }

    if (preWindow) {
      cell.pending += 1;
      cell.attempts += 1;
      continue;
    }

    if (sub.time > nowSeconds) continue;

    cell.pending = 0;
    cell.attempts += 1;

    if (isCorrect(sub.result)) {
      cell.solved = true;
      cell.solvedTime = sub.time;
      solved += 1;
      penalty += Math.floor(sub.time / 60) + cell.wrong * 20;
    } else {
      cell.wrong += 1;
    }
  }

  const cells = {};
  problems.forEach((p) => {
    const cell = state[p.id];
    let status = "empty";
    if (cell.solved) status = "solved";
    else if (cell.pending) status = "pending";
    else if (cell.attempts) status = "attempted";
    cells[p.id] = { ...cell, status };
  });

  return { ...team, solved, penalty, cells };
}

function computeFirstSolves(rows) {
  const first = {};
  rows.forEach((team) => {
    Object.entries(team.cells).forEach(([problemId, cell]) => {
      if (cell.solvedTime !== null) {
        if (!first[problemId] || cell.solvedTime < first[problemId]) {
          first[problemId] = cell.solvedTime;
        }
      }
    });
  });
  return first;
}

function renderProblemCell(problemId, cell, firstMap) {
  const isFirst = cell.status === "solved" && firstMap[problemId] === cell.solvedTime;
  let cls = "score_empty";
  let main = " ";
  let sub = " ";
  if (cell.status === "solved") {
    cls = `score_correct${isFirst ? " score_first" : ""}`;
    main = Math.floor(cell.solvedTime / 60);
    sub = cell.attempts === 1 ? "1 try" : `${cell.attempts} tries`;
  } else if (cell.status === "pending") {
    cls = "score_pending";
    const done = Math.max(0, cell.attempts - cell.pending);
    main = "?";
    sub = `${done} + ${cell.pending} tries`;
  } else if (cell.status === "attempted") {
    cls = "score_incorrect";
    main = "—";
    sub = cell.attempts === 1 ? "1 try" : `${cell.attempts} tries`;
  }
  return `<td class="score_cell"><a><div class="${cls}">${main}<span>${sub}</span></div></a></td>`;
}

function renderScoreboardTable(state, containerId, nowSeconds) {
  const table = document.getElementById("scoreboard-table");
  if (!table) return;

  const expectedProbCols = state.problems.length;
  const currentProbCols = table.querySelectorAll("col.scoreprob").length;
  if (!table.querySelector("thead") || currentProbCols !== expectedProbCols) {
    const colgroups =
      `<colgroup><col id="scoremedal"><col id="scorerank"><col id="scoreflags"><col id="scoreteamname"></colgroup>` +
      `<colgroup><col id="scoresolv"><col id="scoretotal"></colgroup>` +
      `<colgroup>${state.problems.map(() => '<col class="scoreprob">').join("")}</colgroup>`;
    table.innerHTML = `${colgroups}<thead id="scoreboard-head"></thead><tbody id="scoreboard-body"></tbody><tbody id="scoreboard-summary"></tbody>`;
  }

  const tableHead = table.querySelector("#scoreboard-head");
  const tableBody = table.querySelector("#scoreboard-body");
  const tableSummary = table.querySelector("#scoreboard-summary");
  if (!tableHead || !tableBody) return;

  const rows = state.teams.map((team) =>
    computeSnapshot(team, state.problems, nowSeconds, state.contest, state.playback.freezeEnabled, state.myTeam.id)
  );
  const freezeWall = state.playback.freezeEnabled ? state.contest.freezeSeconds : state.contest.lengthSeconds + 1;
  const medals = state.contest.medals || [0, 0, 0];

  rows.sort((a, b) => {
    if (b.solved !== a.solved) return b.solved - a.solved;
    if (a.penalty !== b.penalty) return a.penalty - b.penalty;
    return a.name.localeCompare(b.name);
  });
  const ranks = new Map();
  let currentRank = 1;
  rows.forEach((team, idx) => {
    if (idx > 0) {
      const prev = rows[idx - 1];
      if (team.solved === prev.solved && team.penalty === prev.penalty) {
        // same rank
      } else {
        currentRank = idx + 1;
      }
    }
    ranks.set(team.id, currentRank);
  });

  const firstMap = computeFirstSolves(rows);

  const headHtml =
    `<tr class="scoreheader" data-static="">
      <th title="rank" scope="col" colspan="2">rank</th>
      <th title="team name" scope="col" colspan="2">team</th>
      <th title="# solved / penalty time" scope="col" colspan="2">score</th>` +
    state.problems
      .map(
        (p) =>
          `<th><span class="badge problem-badge" style="background-color: ${p.color}; border: 1px solid ${p.border || p.color}; color:${textColorForHex(
            p.color
          )};">${p.id}</span></th>`
      )
      .join("") +
    `</tr>`;
  tableHead.innerHTML = headHtml;

  const bodyHtml = rows
    .map((team, idx) => {
      const cells = state.problems.map((p) => renderProblemCell(p.id, team.cells[p.id], firstMap)).join("");
      const isSelf = team.id === state.myTeam.id || team.isSelf;
      const safeName = escapeHtml(team.name);
      const safeAffil = escapeHtml(team.affiliation || "");
      let medal = "";
      const place = idx + 1;
      if (place <= medals[0]) medal = `<i class="fa fa-medal gold-medal" style="font-size: 1.5rem;"></i>`;
      else if (place <= medals[0] + medals[1]) medal = `<i class="fa fa-medal silver-medal" style="font-size: 1.5rem;"></i>`;
      else if (place <= medals[0] + medals[1] + medals[2]) medal = `<i class="fa fa-medal bronze-medal" style="font-size: 1.5rem;"></i>`;
      return `<tr class="sortorderswitch ${isSelf ? "scorethisisme" : ""}" data-team-name="${safeName}">
        <td class="no-border">${medal}</td>
        <td class="scorepl rank">${state.playback.freezeEnabled && nowSeconds >= state.contest.freezeSeconds ? "?" : ranks.get(team.id)}</td>
        <td class="scoreaf cl_FFFFFF"></td>
        <td class="scoretn cl_FFFFFF" title="${safeName}">
          <span class="forceWidth">${safeName}</span>
          <span class="univ forceWidth">${safeAffil}</span>
        </td>
        <td class="scorenc">${team.solved}</td>
        <td class="scorett">${team.penalty}</td>
        ${cells}
      </tr>`;
    })
    .join("");

  tableBody.innerHTML = bodyHtml;

  if (tableSummary) {
    const totals = state.problems.map(() => ({ correct: 0, wrong: 0, pending: 0, first: null }));

    state.teams.forEach((team) => {
      state.problems.forEach((p, idx) => {
        let solved = false;
        let solvedTime = null;
        const subs = (team.submissions || [])
          .filter((s) => s.problem === p.id && s.time <= nowSeconds)
          .sort((a, b) => a.time - b.time);
        for (const sub of subs) {
          if (!state.playback.freezeEnabled) {
            if (solved) break;
            if (isCorrect(sub.result)) {
              solved = true;
              solvedTime = sub.time;
              totals[idx].correct += 1;
            } else if (sub.time >= nowSeconds - 30 && sub.time <= nowSeconds && !solved) {
              totals[idx].pending += 1;
            } else {
              totals[idx].wrong += 1;
            }
          } else {
            if (solved && sub.time < freezeWall) continue;
            if (sub.time >= freezeWall) {
              totals[idx].pending += 1;
              continue;
            }
            if (isCorrect(sub.result)) {
              solved = true;
              solvedTime = sub.time;
              totals[idx].correct += 1;
            } else if (sub.time >= nowSeconds - 30 && sub.time <= nowSeconds && !solved) {
              totals[idx].pending += 1;
            } else {
              totals[idx].wrong += 1;
            }
          }
        }
        if (solvedTime !== null) {
          if (totals[idx].first === null || solvedTime < totals[idx].first) totals[idx].first = solvedTime;
        }
      });
    });

    const totalSolved = rows.reduce((sum, r) => sum + r.solved, 0);
    const submSummary = totals
      .map(
        (t) =>
          `<td style="text-align: left;">
            <a>
              <i class="fas fa-thumbs-up fa-fw"></i>
              <span class="submcorrect" style="font-size:90%;" title="number of accepted submissions">${t.correct}</span><br>
              <i class="fas fa-thumbs-down fa-fw"></i>
              <span class="submreject" style="font-size:90%;" title="number of rejected submissions">${t.wrong}</span><br>
              <i class="fas fa-question-circle fa-fw"></i>
              <span class="submpend" style="font-size:90%;" title="number of pending submissions">${t.pending}</span><br>
              <i class="fas fa-clock fa-fw"></i>
              <span style="font-size:90%;" title="first solved">${t.first === null ? "-" : Math.floor(t.first / 60) + "min"}</span>
            </a>
          </td>`
      )
      .join("");
    tableSummary.innerHTML = `<tr style="border-top: 2px solid black;">
      <td class="scoresummary" title="Summary" colspan="4">Summary</td>
      <td class="scorenc" title="total solved">${totalSolved}</td>
      <td></td>
      ${submSummary}
    </tr>`;
  }
}

window.DJScoreboard = {
  renderScoreboardTable,
  computeSnapshot,
  computeFirstSolves
};
