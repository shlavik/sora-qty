import {
  cutData,
  endOfDay,
  preciseTokens,
  startOfDay,
  subDays,
} from "./core.js";

import tokensObj from "./tokens.json" with { type: "json" };

const tokens = Object.values(tokensObj).flatMap(el => el);
const baseUrl = "https://mof.sora.org/qty/";

grab().then((grabbed) => {
  const now = Date.now();
  const append = (value) => (parsed) => (
    parsed.length > 1 &&
      value[1] === parsed[parsed.length - 2][1] &&
      value[1] === parsed[parsed.length - 1][1]
      ? parsed.splice(-1, 1, value)
      : parsed.push(value), parsed
  );
  const write = (token) => (data) => {
    Deno.writeTextFile("./data/" + token + ".json", JSON.stringify(data));
    const yearAgo = startOfDay(subDays(now, 366)).valueOf();
    const yearData = cutData(data, yearAgo);
    const monthAgo = startOfDay(subDays(now, 32)).valueOf();
    const monthData = cutData(yearData, monthAgo);
    const prepared = compressDaily(
      yearData.filter(([timestamp]) => timestamp < monthAgo),
    ).concat(monthData);
    Deno.writeTextFile(
      "./data/prepared/" + token + ".json",
      JSON.stringify(prepared),
    );
  };
  grabbed.forEach(([token, qty]) => {
    Deno.readTextFile("./data/" + token + ".json")
      .then(JSON.parse)
      .catch(() => [])
      .then(append([now, qty]))
      .then(write(token));
  });
});

function grab() {
  return Promise.allSettled(
    tokens.map((token) =>
      fetch(baseUrl + token)
        .then((response) => response.text())
        .then((text) => [token, formatValue(text, token)])
    ),
  ).then((result) =>
    result
      .filter(({ status }) => status === "fulfilled")
      .map(({ value }) => value)
      .filter(([_, value]) => value >= 0)
  );
}

function compressDaily(data) {
  const dailyData = new Map();
  data.forEach(([timestamp, value]) => {
    const start = startOfDay(timestamp).valueOf();
    if (!dailyData.has(start)) {
      dailyData.set(start, value);
    }
    const end = endOfDay(timestamp).valueOf();
    dailyData.set(end, value);
  });
  return Array.from(dailyData);
}

function formatValue(value, token) {
  const float = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(float)) return NaN;
  if (preciseTokens.includes(token)) {
    const round = Math.round(100_000 * float) / 100_000;
    return round;
  }
  const round = Math.round(1000 * float) / 1000;
  return round < 100 ? round : Math.trunc(round);
}
