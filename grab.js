import tokens from "./tokens.json" assert { type: "json" };

const baseUrl = "https://mof.sora.org/qty/";

grab().then((grabbed) => {
  const now = Date.now();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const append = (value) => (parsed) => (
    parsed.length > 1 &&
    value[1] === parsed.at(-2)[1] &&
    value[1] === parsed.at(-1)[1]
      ? parsed.splice(-1, 1, value)
      : parsed.push(value),
    parsed
  );
  grabbed.forEach(([token, qty]) => {
    const path = "./data/" + token + ".json";
    Deno.readFile(path)
      .then((file) => decoder.decode(file))
      .then(JSON.parse)
      .catch(() => [])
      .then(append([now, qty]))
      .then(JSON.stringify)
      .then((json) => encoder.encode(json))
      .then((encoded) => Deno.writeFile(path, encoded));
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
