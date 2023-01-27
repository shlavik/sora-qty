import {
  createCanvas,
  Fonts,
  Image,
} from "https://deno.land/x/skia_canvas@0.4.1/mod.ts";

import { registerDrawImage, drawCard, drawPreview } from "./utils.js";

import tokens from "./tokens.json" assert { type: "json" };

const dataset = Object.fromEntries(
  await Promise.all(
    tokens.map((token) =>
      import("./data/monthly/" + token + ".json", { assert: { type: "json" } })
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
  const header = "# [Sora quantity monitor](https://sora-qty.info)\n\n";
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

tokens.forEach(renderCard);

function renderCard(token) {
  const canvas = createCanvas(360, 630);
  const context = canvas.getContext("2d");
  drawCard(
    context,
    [
      [0, 0],
      [canvas.width, canvas.height],
    ],
    {
      token,
      data: dataset[token],
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
        ["xor", "xst", "xstusd"].includes(token)
      ),
    }
  );
  canvas.save("./images/preview.png");
})();
