const baseUrl = "https://mof.sora.org/qty/";
const tokens = ["xor", "val", "pswap", "xst", "xstusd"];

grab().then((grabbed) => {
  const now = Date.now();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  grabbed.forEach(([token, qty]) => {
    const path = "./data/" + token + ".json";
    Deno.readFile(path)
      .then((file) => decoder.decode(file))
      .then(JSON.parse)
      .catch(() => [])
      .then((parsed) => (parsed.push([now, qty]), parsed))
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
