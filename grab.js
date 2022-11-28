import { subDays, cutData } from "./utils.js";

import tokens from "./tokens.json" assert { type: "json" };

const baseUrl = "https://mof.sora.org/qty/";

grab().then((grabbed) => {
  const now = Date.now();
  const append = (value) => (parsed) => (
    parsed.length > 1 &&
    value[1] === parsed.at(-2)[1] &&
    value[1] === parsed.at(-1)[1]
      ? parsed.splice(-1, 1, value)
      : parsed.push(value),
    parsed
  );
  const write = (token) => (data) => {
    Deno.writeTextFile("./data/" + token + ".json", JSON.stringify(data));
    const start = subDays(now, 8).valueOf();
    const weekly = cutData(data, start);
    Deno.writeTextFile(
      "./data/weekly/" + token + ".json",
      JSON.stringify(weekly)
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
        .then((text) => [token, parseInt(text)])
    )
  ).then((result) =>
    result
      .filter(({ status }) => status === "fulfilled")
      .map(({ value }) => value)
  );
}
