import {
  createCanvas,
  Fonts,
  Image,
} from "https://deno.land/x/skia_canvas@0.4.0/mod.ts";
import { endOfDay, startOfDay, sub } from "npm:date-fns";
import { zonedTimeToUtc } from "npm:date-fns-tz";

import tokens from "./tokens.json" assert { type: "json" };

const tokenData = Object.fromEntries(
  await Promise.all(
    tokens.map((token) =>
      import("./data/" + token + ".json", { assert: { type: "json" } })
        .then((result) => result.default)
        .catch(() => [])
        .then((value) => [token, value])
    )
  )
);

const path = "./fonts/Sora-SemiBold.ttf";
const file = Deno.readFileSync(path);
Fonts.register(file, "sora");

(function renderReadme() {
  const header = "# [Sora qty weekly analyzer](https://sora-qty.info)\n";
  const pics = tokens
    .map((token) => {
      const url = "https://mof.sora.org/qty/" + token;
      return `[![${url}](./images/${token}.png "${url}")](${url})`;
    })
    .join("\n");
  Deno.writeTextFileSync("./README.md", header + pics);
})();

tokens.forEach(renderCart);

function renderCart(token) {
  const width = 360;
  const height = 630;
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");
  drawCart(
    context,
    [
      [0, 0],
      [width, height],
    ],
    { token }
  );
  canvas.save("./images/" + token + ".png");
}

function drawCart(ctx, [[x1, y1], [x2, y2]], { token }) {
  const data = tokenData[token];
  const padding = 32;
  drawRect(
    ctx,
    [
      [x1, y1],
      [x2, y2],
    ],
    {
      fill: "#492067",
    }
  );
  drawImage(ctx, [padding, padding], "./images/icons/" + token + ".png");
  drawBorder(
    ctx,
    [
      [padding, padding],
      [padding + 80, padding + 80],
    ],
    { radius: 40, line: 3 }
  );
  drawToken(ctx, [x2 - padding, 64], token);
  drawText(ctx, [(x2 - x1) / 2, 132], {
    text: addSeparator(data.at(-1)[1]),
    color: "yellow",
    size: 36,
  });
  drawDetails(
    ctx,
    [
      [padding, 200],
      [x2 - padding, y2 - padding],
    ],
    data
  );
}

function drawRect(ctx, [[x1, y1], [x2, y2]], { fill = "white" } = {}) {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.fillRect(x1, y1, x2, y2);
  ctx.restore();
}

function drawLine(ctx, [[x1, y1], [x2, y2]], { color, line } = {}) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = line;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function drawArc(ctx, [x, y], { radius, start, end, color, line } = {}) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = line;
  ctx.beginPath();
  ctx.arc(x, y, radius, (start / 180) * Math.PI, (end / 180) * Math.PI);
  ctx.stroke();
  ctx.restore();
}

function drawPolyline(ctx, points, { filled = false } = {}) {
  if (filled) {
    const x1 = points[0][0];
    const x2 = points.at(-1)[0];
    const allY = points.map(([_, y]) => y);
    const y1 = Math.min(...allY);
    const y2 = Math.max(...allY) + ctx.lineWidth;
    const x = (x1 + x2) / 2;
    const gradient = ctx.createLinearGradient(x, y1, x, y2);
    gradient.addColorStop(0, "rgba(255, 255, 0, 0.4)");
    gradient.addColorStop(1, "rgba(255, 255, 0, 0)");
    ctx.fillStyle = gradient;
    points.unshift([x1, y2]);
    points.push([x2, y2]);
  }
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i][0], points[i][1]);
  }
  filled ? ctx.fill() : ctx.stroke();
  ctx.restore();
}

function drawChart(ctx, points, { color = "yellow", line = 2 } = {}) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = line;
  drawPolyline(ctx, points);
  drawPolyline(ctx, points, { filled: true });
  ctx.restore();
}

function drawRuler(
  ctx,
  [[x1, y1], [x2, y2]],
  { segment = 7, color = "rgba(255, 255, 255, 0.2)", line = 2 } = {}
) {
  const step = (x2 - x1) / segment;
  let day = zonedTimeToUtc(new Date(), "UTC");
  for (let i = segment; i > 0; i--) {
    const x = x1 + i * step;
    drawLine(
      ctx,
      [
        [x, y1],
        [x, y2],
      ],
      {
        color,
        line,
      }
    );
    const [_, month, date] = day.toISOString().slice(0, 10).split("-");
    day = sub(day, { days: 1 });
    drawText(ctx, [x - step / 2, y1 - 3], {
      text: month + "." + date,
      color,
      size: 14,
    });
    drawText(ctx, [x - step / 2, y2 - 15], {
      text: month + "." + date,
      color,
      size: 14,
    });
  }
}

function drawBorder(
  ctx,
  [[x1, y1], [x2, y2]],
  { radius = 24, color = "white", line = 2 } = {}
) {
  const style = { radius, color, line };
  drawLine(
    ctx,
    [
      [x1 + radius, y1],
      [x2 - radius, y1],
    ],
    style
  );
  drawLine(
    ctx,
    [
      [x2, y1 + radius],
      [x2, y2 - radius],
    ],
    style
  );
  drawLine(
    ctx,
    [
      [x1 + radius, y2],
      [x2 - radius, y2],
    ],
    style
  );
  drawLine(
    ctx,
    [
      [x1, y1 + radius],
      [x1, y2 - radius],
    ],
    style
  );
  drawArc(ctx, [x1 + radius, y1 + radius], {
    ...style,
    start: 180,
    end: 270,
  });
  drawArc(ctx, [x2 - radius, y1 + radius], {
    ...style,
    start: 270,
    end: 0,
  });
  drawArc(ctx, [x2 - radius, y2 - radius], {
    ...style,
    start: 0,
    end: 90,
  });
  drawArc(ctx, [x1 + radius, y2 - radius], {
    ...style,
    start: 90,
    end: 180,
  });
}

function drawText(
  ctx,
  [x, y],
  { text, align = "center", color = "white", size = 20 } = {}
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = size + "px sora";
  ctx.textAlign = align;
  ctx.textBaseline = "bottom";
  const metrics = ctx.measureText(text);
  ctx.fillText(
    text,
    x + metrics.actualBoundingBoxLeft,
    y + metrics.fontBoundingBoxAscent
  );
  ctx.restore();
}

function drawToken(ctx, [x, y], token) {
  token = token.toString().toUpperCase();
  const size = {
    3: 64,
    4: 56,
    5: 48,
    6: 44,
  }[token.length];
  drawText(ctx, [x, y - size / 2], {
    text: token.toUpperCase(),
    align: "right",
    size,
  });
}

function drawImage(ctx, [x, y], path) {
  const img = new Image(path);
  ctx.drawImage(img, x, y);
}

function drawDetails(ctx, [[x1, y1], [x2, y2]], data = []) {
  const padding = 48;
  const now = Date.now();
  const start = zonedTimeToUtc(
    startOfDay(sub(now, { days: 7 })),
    "UTC"
  ).valueOf();
  const end = zonedTimeToUtc(endOfDay(now), "UTC").valueOf();
  const step = (x2 - x1) / (end - start);
  const filtered = data.filter(([t]) => t >= start);
  const min = Math.min(...filtered.map(([_, v]) => v));
  const max = Math.max(...filtered.map(([_, v]) => v));
  const height = y2 - y1 - 3 * padding;
  const points = filtered.map(([t, v]) => [
    x1 + (t - start) * step,
    min === max
      ? (y1 + y2) / 2
      : y1 + 1.5 * padding + height - (height * (v - min)) / (max - min),
  ]);
  drawRuler(ctx, [
    [x1, y1 + padding],
    [x2, y2 - padding],
  ]);
  drawBorder(ctx, [
    [x1, y1],
    [x2, y2],
  ]);
  drawText(ctx, [(x1 + x2) / 2, y1 + 12], {
    text: addSeparator(max),
  });
  drawText(ctx, [(x1 + x2) / 2, y2 - 38], {
    text: addSeparator(min),
  });
  drawChart(ctx, points);
}

function addSeparator(text) {
  return new Intl.NumberFormat("en-US").format(text);
}
