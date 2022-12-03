import {
  createCanvas,
  Fonts,
  Image,
} from "https://deno.land/x/skia_canvas/mod.ts";

import { registerDrawImage, drawCart, drawPreview } from "./utils.js";

import tokens from "./tokens.json" assert { type: "json" };

const tokenData = Object.fromEntries(
  await Promise.all(
    tokens.map((token) =>
      import("./data/weekly/" + token + ".json", { assert: { type: "json" } })
        .then((result) => result.default)
        .catch(() => [])
        .then((value) => [token, value])
    )
  )
);

const fontPath = "./fonts/Sora-SemiBold.ttf";
const fontFile = Deno.readFileSync(fontPath);
Fonts.register(fontFile, "sora");

registerDrawImage((ctx, [x, y], path) => {
  const img = new Image(path);
  ctx.drawImage(img, x, y);
});

(function renderReadme() {
  const header = "# [Sora qty weekly analyzer](https://sora-qty.info)\n\n";
  const date = "> " + new Date() + "\n\n";
  const pics = tokens
    .map((token) => {
      const url = "https://mof.sora.org/qty/" + token;
      return `[![${url}](./images/${token}.png "${url}")](${url})`;
    })
    .join("\n");
  Deno.writeTextFile("./README.md", header + date + pics);
})();

(function renderTimeStamp() {
  Deno.writeTextFile("./timestamp.json", Date.now());
})();

tokens.forEach(renderCart);

function renderCart(token) {
  const canvas = createCanvas(360, 630);
  const context = canvas.getContext("2d");
  drawCart(
    context,
    [
      [0, 0],
      [canvas.width, canvas.height],
    ],
    {
      token,
      data: tokenData[token],
      icon: "./images/icons/" + token + ".png",
    }
  );
  canvas.save("./images/" + token + ".png");
}

(function renderPreview() {
  const canvas = createCanvas(1200, 630);
  const context = canvas.getContext("2d");
  drawPreview(
    context,
    [
      [0, 0],
      [canvas.width, canvas.height],
    ],
    {
      tokens: tokens.filter((token) =>
        ["xor", "xstusd", "xst"].includes(token)
      ),
    }
  );
  canvas.save("./images/preview.png");
})();
