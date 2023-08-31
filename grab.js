import { subDays, cutData } from "./utils.js";

import tokens from "./tokens.json" assert { type: "json" };

const baseUrl = "https://mof.sora.org/qty/";

grab().then((grabbed) => {
  const now = Date.now();
  const append = (value) => (parsed) => (
    parsed.length > 1 &&
    value[1] === parsed[parsed.length - 2][1] &&
    value[1] === parsed[parsed.length - 1][1]
      ? parsed.splice(-1, 1, value)
      : parsed.push(value),
    parsed
  );
  const write = (token) => (data) => {
    Deno.writeTextFile("./data/" + token + ".json", JSON.stringify(data));
    const monthly = cutData(data, subDays(now, 33).valueOf());
    Deno.writeTextFile(
      "./data/monthly/" + token + ".json",
      JSON.stringify(monthly)
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

function parseValue(str) {
  const float = parseFloat(str);
  if (Number.isNaN(float)) return NaN;
  const round = Math.round(100_000 * float) / 100_000;
  return round < 100 ? round : Math.trunc(round);
}

function grab() {
  return Promise.allSettled(
    tokens.map((token) =>
      fetch(baseUrl + token)
        .then((response) => response.text())
        .then((text) => [token, parseValue(text)])
    )
  ).then((result) =>
    result
      .filter(({ status }) => status === "fulfilled")
      .map(({ value }) => value)
      .filter(([_, value]) => value >= 0)
  );
}
