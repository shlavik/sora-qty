import { createCanvas, Fonts, Image } from "jsr:@gfx/canvas@0.5.6";

import {
  cardHeight,
  cardWidth,
  colorBackground,
  drawCard,
  drawImage,
  drawRect,
  registerCreateCanvas,
  registerDrawImage,
} from "./core.js";

registerCreateCanvas((cardWidth, cardHeight) =>
  createCanvas(cardWidth, cardHeight)
);

registerDrawImage((ctx, [x, y], { img, width, height }) => {
  ctx.drawImage(new Image(img), x, y, width, height);
});

const fontPath = "./fonts/Sora-SemiBold.ttf";
const fontFile = Deno.readFileSync(fontPath);
Fonts.register(fontFile, "sora");

const tokens = ["xor", "tbcd", "val", "pswap", "dot", "ksm", "eth", "dai"];

const dataset = Object.fromEntries(
  await Promise.all(
    tokens.map((token) =>
      import("./data/prepared/" + token + ".json", { with: { type: "json" } })
        .then((result) => result.default)
        .catch(() => [])
        .then((value) => [token, value])
    )
  )
);

(function renderReadme() {
  const header = "# [Sora quantity monitor](https://sora-qty.info)\n\n";
  const description =
    "Check circulating supply of [Sora](https://sora.org) selected tokens\n\n";
  const date = "> last update: " + new Date().toISOString() + "\n\n";
  const pics = tokens
    .map((token) => {
      const url = "https://mof.sora.org/qty/" + token;
      return `[![${url}](./images/${token}.png "${url}")](${url})`;
    })
    .join("\n");
  Deno.writeTextFile("./README.md", header + description + date + pics);
})();

(function renderTimeStamp() {
  Deno.writeTextFile("./timestamp.json", Date.now());
})();

tokens.forEach(renderCard);

function renderCard(token) {
  const canvas = createCanvas(cardWidth, cardHeight);
  const context = canvas.getContext("2d");
  drawCard(context, {
    token,
    data: dataset[token],
    icon: "./images/icons/" + token + ".png",
    cached: false,
  });
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
      tokens: [
        ["xor", "val", "dot"],
        ["tbcd", "pswap", "ksm"],
      ],
    }
  );
  canvas.save("./images/preview.png");
})();

function drawPreview(ctx, [[x1, y1], [x2, y2]], { tokens = [] } = {}) {
  drawRect(
    ctx,
    [
      [x1, y1],
      [x2, y2],
    ],
    {
      fill: colorBackground,
    }
  );
  for (const [i, row] of Object.entries(tokens)) {
    for (const [j, token] of Object.entries(row)) {
      drawImage(ctx, [30 + j * (cardWidth + 30), Number(i) ? cardHeight : 0], {
        img: "./images/" + token + ".png",
      });
    }
  }
}
