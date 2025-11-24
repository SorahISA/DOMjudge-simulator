"use strict";

const STATE_KEY = "dj_state_v1";

const TEST_DATA = {
  contest: {
    name: "Testing Contest",
    length: 3600,
    freeze: 1800,
    medals: [4, 4, 4],
    n_problems: 3,
    problems: [
      { short: "A", name: "Hello World!", code: "helloworld", color: "#FF0000", border: "#bf0000" },
      { short: "B", name: "A + B Problem", code: "aplusb", color: "#00FF00", border: "#00bf00" },
      { short: "C", name: "A * B Problem", code: "atimesb", color: "#0000FF", border: "#0000bf" }
    ]
  },
  contestant: []
};

function convertContestFormat(payload) {
  const contest = payload?.contest || {};
  const problems =
    contest.problems?.map((entry, idx) => {
      if (entry && typeof entry === "object" && ("short" in entry || "name" in entry || "code" in entry || "color" in entry || "border" in entry)) {
        const short = entry.short || entry.code || `P${idx + 1}`;
        const color = entry.color || "#f5f5f5";
        const border = entry.border || color;
        return {
          id: short,
          short,
          name: entry.name || short,
          code: entry.code || short,
          color,
          border
        };
      }
      const [id, color] = Object.entries(entry || {})[0] || [`P${idx + 1}`, "#f5f5f5"];
      const fallbackColor = color || "#f5f5f5";
      return { id, short: id, name: id, code: id, color: fallbackColor, border: fallbackColor };
    }) || [];
  const teams =
    (payload?.contestant || []).map((c, idx) => ({
      id: `t${idx + 1}`,
      name: c.name || `Team ${idx + 1}`,
      affiliation: c.affiliation || "",
      country: c.country,
      submissions: (c.submissions || []).map((s) => {
        const resRaw = s.result;
        const res =
          typeof resRaw === "number"
            ? resRaw === 1
              ? "correct"
              : "wrong-answer"
            : String(resRaw || "wrong-answer").toLowerCase();
        return { problem: s.problem, time: s.time || 0, result: res, lang: s.lang || "C++" };
      })
    })) || [];
  return {
    contest: {
      name: contest.name || "Contest",
      startTime: null,
      lengthSeconds: contest.length || 18000,
      freezeSeconds: contest.freeze ?? 14400,
      medals: contest.medals || [0, 0, 0]
    },
    problems,
    teams
  };
}

const DEFAULT_FROM_TEST = convertContestFormat(TEST_DATA);
const DEFAULT_PROBLEMS = DEFAULT_FROM_TEST.problems;
const DEFAULT_TEAMS = DEFAULT_FROM_TEST.teams;

function defaultState() {
  return {
    contest: DEFAULT_FROM_TEST.contest,
    problems: DEFAULT_PROBLEMS,
    teams: DEFAULT_TEAMS.map((team) => ({
      ...team,
      submissions: Array.isArray(team.submissions)
        ? team.submissions.map((s) => ({ ...s, lang: s.lang || "C++" }))
        : []
    })),
    myTeam: { id: "self", name: "My Team", affiliation: "Local University" },
    playback: { secondsPerTick: 10, ticksPerSecond: 6, freezeEnabled: true }
  };
}

function normalizeState(state) {
  const merged = { ...defaultState(), ...state };
  merged.contest = { ...defaultState().contest, ...(state?.contest || {}) };
  merged.playback = { ...defaultState().playback, ...(state?.playback || {}) };
  merged.problems = (state?.problems && state.problems.length ? state.problems : DEFAULT_PROBLEMS).map((p, idx) => {
    const color = p.color || "#f5f5f5";
    return {
      id: p.id || p.short || p.code || `P${idx + 1}`,
      short: p.short || p.id || p.code || `P${idx + 1}`,
      name: p.name || p.id || `P${idx + 1}`,
      code: p.code || p.id || p.short || `P${idx + 1}`,
      color,
      border: p.border || color
    };
  });
  const teamMap = new Map();
  (state?.teams || []).forEach((t) => {
    const subs = Array.isArray(t.submissions)
      ? t.submissions.map((s) => ({ ...s, lang: s.lang || "C++" }))
      : [];
    teamMap.set(t.id, { ...t, submissions: subs });
  });
  // ensure my team exists
  const myTeam = { ...defaultState().myTeam, ...(state?.myTeam || {}) };
  if (!teamMap.has(myTeam.id)) {
    teamMap.set(myTeam.id, { ...myTeam, isSelf: true, submissions: [] });
  } else {
    teamMap.set(myTeam.id, { ...teamMap.get(myTeam.id), isSelf: true, name: myTeam.name, affiliation: myTeam.affiliation });
  }
  merged.myTeam = myTeam;
  merged.teams = Array.from(teamMap.values());
  return merged;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return normalizeState(parsed);
  } catch (err) {
    console.warn("Failed to load state, resetting", err);
    return defaultState();
  }
}

function saveState(state) {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

function setMyTeam(name, affiliation) {
  const state = loadState();
  state.myTeam.name = name || state.myTeam.name;
  state.myTeam.affiliation = affiliation || state.myTeam.affiliation;
  const idx = state.teams.findIndex((t) => t.id === state.myTeam.id);
  if (idx >= 0) {
    state.teams[idx] = { ...state.teams[idx], name: state.myTeam.name, affiliation: state.myTeam.affiliation, isSelf: true };
  } else {
    state.teams.push({ ...state.myTeam, isSelf: true, submissions: [] });
  }
  saveState(state);
  return state;
}

function setContestStart(startTimeISO) {
  const state = loadState();
  state.contest.startTime = startTimeISO;
  saveState(state);
  return state;
}

function setPlaybackSettings(update) {
  const state = loadState();
  state.playback = { ...state.playback, ...update };
  saveState(state);
  return state;
}

function importContest(payload) {
  if (payload && payload.contestant) {
    return importContestFormat(payload);
  }
  const state = loadState();
  if (payload.name) state.contest.name = payload.name;
  if (payload.lengthSeconds) state.contest.lengthSeconds = payload.lengthSeconds;
  if (payload.freezeSeconds !== undefined) state.contest.freezeSeconds = payload.freezeSeconds;
   if (payload.medals) state.contest.medals = payload.medals;
  if (Array.isArray(payload.problems)) state.problems = payload.problems.map((p) => ({ ...p }));
  if (Array.isArray(payload.teams)) state.teams = payload.teams.map((t) => ({ ...t, submissions: t.submissions || [] }));
  saveState(state);
  return state;
}

function importContestFormat(payload) {
  const converted = convertContestFormat(payload);
  const state = loadState();
  state.contest = { ...state.contest, ...converted.contest };
  state.problems = converted.problems;
  state.teams = converted.teams;
  saveState(state);
  return state;
}

function exportContestFormat(state) {
  const normalized = normalizeState(state);
  const isCorrect = (res) => (res || "").toLowerCase() === "correct";
  const outContest = {
    name: normalized.contest.name,
    length: normalized.contest.lengthSeconds,
    freeze: normalized.contest.freezeSeconds,
    medals: normalized.contest.medals || [0, 0, 0],
    n_problems: normalized.problems.length,
    problems: normalized.problems.map((p, idx) => ({
      short: p.short || p.id || `P${idx + 1}`,
      name: p.name || p.id || `P${idx + 1}`,
      code: p.code || p.id || p.short || `P${idx + 1}`,
      color: p.color || "#f5f5f5",
      border: p.border || p.color || "#f5f5f5"
    }))
  };
  const teams = normalized.teams.map((t) => ({
    name: t.name,
    affiliation: t.affiliation,
    submissions: (t.submissions || []).map((s) => ({
      problem: s.problem,
      time: s.time,
      result: isCorrect(s.result) ? 1 : 0
    }))
  }));
  return { contest: outContest, contestant: teams };
}

function addSubmission(teamId, problemId, result, timeSeconds, lang = "C++") {
  const state = loadState();
  const teamIdx = state.teams.findIndex((t) => t.id === teamId);
  if (teamIdx === -1) {
    state.teams.push({ id: teamId, name: teamId, affiliation: "Unknown", submissions: [] });
  }
  const team = state.teams.find((t) => t.id === teamId);
  if (!team.submissions) team.submissions = [];
  team.submissions.push({ time: timeSeconds, problem: problemId, result, lang });
  team.submissions.sort((a, b) => a.time - b.time);
  saveState(state);
  return state;
}

window.DJState = {
  loadState,
  saveState,
  setMyTeam,
  setContestStart,
  setPlaybackSettings,
  importContest,
  importContestFormat,
  exportContestFormat,
  addSubmission,
  defaultState,
  normalizeState
};
