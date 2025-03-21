export const preciseTokens = ["karma", "ken", "kbtc", "xstbtc"];

let createCanvas = (cardWidth, cardHeight) => document.createElement("canvas");

export function registerCreateCanvas(cc) {
  createCanvas = cc;
}

export let drawImage = (ctx, [x, y], { img, width, height }) => {
  if (!img) return;
  ctx.drawImage(img, x, y, width, height);
};

export function registerDrawImage(di) {
  drawImage = di;
}

export const colorBackground = "#51276C";
export const colorYear = "#45215C";
export const cardWidth = 360;
export const cardHeight = 315;
const cardPadding = 32;
const iconX = cardPadding + 16;
const iconY = cardPadding;
const iconSize = 48;
const detailsX1 = cardPadding;
const detailsY1 = 102;
const detailsX2 = cardWidth - cardPadding;
const detailsY2 = cardHeight - cardPadding;
const detailsPos = [
  [detailsX1, detailsY1],
  [detailsX2, detailsY2],
];

export function drawCard(
  ctx,
  {
    token = "",
    data = [],
    icon = null,
    timeframe = "month",
    crossVisible = true,
    valueVisible = true,
    cached = true,
  } = {}
) {
  drawBackground(ctx, timeframe, cached);
  if (icon) {
    drawImage(ctx, [iconX, iconY], {
      img: icon,
      width: iconSize,
      height: iconSize,
    });
  }
  if (token) drawToken(ctx, [cardWidth - iconSize, 62], token);
  return drawDetails(ctx, detailsPos, {
    data,
    token,
    timeframe,
    valueVisible,
    crossVisible,
  });
}

const backgroundCache = {};

export function drawBackground(ctx, timeframe = "week", cached = true) {
  if (cached && backgroundCache[timeframe]) {
    return ctx.putImageData(backgroundCache[timeframe], 0, 0);
  }
  drawRect(
    ctx,
    [
      [0, 0],
      [cardWidth, cardHeight],
    ],
    {
      fill: colorBackground,
    }
  );
  drawBorder(
    ctx,
    [
      [iconX - 2, iconY - 2],
      [iconX + iconSize + 2, iconY + iconSize + 2],
    ],
    { radius: 2 + iconSize / 2 }
  );
  drawRuler(ctx, detailsPos, { timeframe });
  drawGradient(ctx, detailsPos, { timeframe });
  drawBorder(
    ctx,
    [
      [cardPadding - 2, detailsY1 - 2],
      [detailsX2 + 2, detailsY2 + 2],
    ],
    { radius: 20 }
  );
  if (cached && !backgroundCache[timeframe]) {
    backgroundCache[timeframe] = ctx.getImageData(0, 0, cardWidth, cardHeight);
  }
}

export function drawRuler(
  ctx,
  [[x1, y1], [x2, y2]],
  { timeframe, color = "black" } = {}
) {
  const line =
    {
      week: 2,
      month: 1.25,
      year: 0.5,
    }[timeframe] || 1;
  const segment =
    {
      week: 7,
      month: 33,
      year: 148,
    }[timeframe] || 33;
  const step = (x2 - x1) / segment;
  for (let i = segment; i > 0; i--) {
    const lineX = x1 + i * step;
    if (i !== segment) {
      drawLine(
        ctx,
        [
          [lineX, y1],
          [lineX, y2],
        ],
        {
          color,
          line,
        }
      );
    }
  }
}

export function drawGradient(
  ctx,
  [[x1, y1], [x2, y2]],
  {
    color1 = colorBackground,
    color2 = "rgba(81, 39, 108, 0.5)",
    color3 = "rgba(81, 39, 108, 0)",
    height = iconSize,
    timeframe,
    ratio1 = {
      week: 0.1,
      month: 0.1,
      year: 0,
    }[timeframe] || 0.1,
    ratio2 = {
      week: 0.6,
      month: 0.5,
      year: 0.4,
    }[timeframe] || 0.5,
  } = {}
) {
  const topGradient = ctx.createLinearGradient(0, y1, 0, y1 + height);
  topGradient.addColorStop(0, color1);
  topGradient.addColorStop(ratio1, color1);
  topGradient.addColorStop(ratio2, color2);
  topGradient.addColorStop(1, color3);
  ctx.fillStyle = topGradient;
  ctx.fillRect(x1, y1, x2 - x1, height);

  const bottomGradient = ctx.createLinearGradient(0, y2, 0, y2 - height);
  bottomGradient.addColorStop(0, color1);
  bottomGradient.addColorStop(ratio1, color1);
  bottomGradient.addColorStop(ratio2, color2);
  bottomGradient.addColorStop(1, color3);
  ctx.fillStyle = bottomGradient;
  ctx.fillRect(x1, y2 - height, x2 - x1, height);
}

export function drawToken(ctx, [x, y], token = "") {
  const tokenAlign = "right";
  const tokenSize =
    {
      3: 62,
      4: 54,
      5: 48,
      6: 44,
      7: 40,
    }[token.length] || 62;
  drawText(ctx, [x, y - (isDeno() ? 3 : 0)], {
    text: token.toUpperCase(),
    align: tokenAlign,
    size: tokenSize,
  });
}

export function drawDetails(
  ctx,
  [[x1, y1], [x2, y2]],
  { data = [], token, timeframe, valueVisible = true, crossVisible = true } = {}
) {
  x1 += 1;
  x2 -= 1;
  if (timeframe === "year") x2 -= 1;
  const padding = 20;
  const valueY = 195;
  const now = Date.now();
  const start = startOfDay(
    subDays(now, { week: 6, month: 32, year: 366 }[timeframe])
  ).valueOf();
  const end = endOfDay(now).valueOf();
  const step = (x2 - x1) / (end - start);
  const cutted = cutData(data, start);
  const min = cutted.length > 0 ? Math.min(...cutted.map(([_, v]) => v)) : 0;
  const max = cutted.length > 0 ? Math.max(...cutted.map(([_, v]) => v)) : 0;
  // MIN MAX
  if (data.length > 0) {
    const textX = (x1 + x2) / 2;
    drawText(ctx, [textX, y1 + padding], {
      text: addSeparator(formatValue(max, token)),
    });
    drawText(ctx, [textX, y2 - padding + (isDeno() ? 0 : 2)], {
      text: addSeparator(formatValue(min, token)),
    });
  }
  // CHART
  const chartPadding =
    padding +
    {
      week: 5,
      month: 7,
      year: 10,
    }[timeframe];
  const height = y2 - y1 - 3 * chartPadding;
  const points = cutted.map(([t, v]) => [
    x1 + (t - start) * step,
    min === max
      ? (y1 + y2) / 2
      : y1 + 1.5 * chartPadding + height - (height * (v - min)) / (max - min),
  ]);
  drawChart(ctx, points);
  // VALUE
  if (valueVisible && data.length > 0) {
    const value = data[data.length - 1][1];
    if (value)
      drawValue(
        ctx,
        [cardPadding + (x2 - x1) / 2, valueY - (isDeno() ? 2 : 0)],
        { token, value }
      );
  }
  // CROSS
  if (crossVisible && points.length > 0) {
    drawCross(ctx, points[points.length - 1]);
  }
  return { cutted, points };
}

export function drawChart(ctx, points = []) {
  if (!points || points.length < 1) return;
  ctx.save();
  ctx.lineJoin = "round";
  drawPolyline(ctx, points, { filled: true });
  ctx.strokeStyle = colorBackground;
  ctx.lineWidth = 5;
  drawPolyline(ctx, points);
  ctx.strokeStyle = "yellow";
  ctx.lineWidth = 2;
  drawPolyline(ctx, points);
  ctx.restore();
}

export function formatValue(value, token) {
  if (preciseTokens.includes(token)) return value;
  return value >= 100 ? Math.round(value) : value;
}

export function isTooManyZeros(value) {
  return (
    String(value)
      .split("")
      .reduce((acc, el) => acc + !+el, 0) > 11
  );
}

export function drawValue(ctx, [x, y], { token, value = 0 }) {
  value = formatValue(value, token);
  const text = addSeparator(value);
  let size =
    value > 99999999999999999
      ? 22
      : value > 9999999999999999
      ? 23
      : value > 999999999999999
      ? 24
      : value > 99999999999999
      ? 25
      : value > 9999999999999
      ? 26
      : value > 999999999999
      ? 29
      : value > 99999999999
      ? 32
      : value > 9999999999
      ? 34
      : 36;
  if (isTooManyZeros(value)) size = Math.round(size * 0.94);
  const padding = size / 3;
  const gradient = ctx.createLinearGradient(x, y - padding, x, y + padding);
  gradient.addColorStop(0, "yellow");
  gradient.addColorStop(1, "red");
  drawText(ctx, [x, y], {
    text,
    gradient,
    line: 4.5,
    stroke: colorYear,
    size,
  });
}

export function addSeparator(text) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(text);
}
export function drawCross(ctx, [x, y]) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const dash1 = [
    [x - 8, y - 8],
    [x - 3, y - 3],
  ];
  const dash2 = [
    [x + 8, y - 8],
    [x + 3, y - 3],
  ];
  const dash3 = [
    [x + 8, y + 8],
    [x + 3, y + 3],
  ];
  const dash4 = [
    [x - 8, y + 8],
    [x - 3, y + 3],
  ];
  ctx.strokeStyle = "black";
  ctx.lineWidth = 6;
  drawPolyline(ctx, dash1);
  drawPolyline(ctx, dash2);
  drawPolyline(ctx, dash3);
  drawPolyline(ctx, dash4);
  ctx.strokeStyle = "red";
  ctx.lineWidth = 4;
  drawPolyline(ctx, dash1);
  drawPolyline(ctx, dash2);
  drawPolyline(ctx, dash3);
  drawPolyline(ctx, dash4);
  ctx.restore();
}

export function drawText(
  ctx,
  [x, y],
  {
    text,
    align = "center",
    baseline = "middle",
    color = "white",
    font = "sora",
    gradient = false,
    line = 0,
    stroke = "",
    size = 20,
    restrict,
  } = {}
) {
  ctx.save();
  ctx.font = size + "px " + font;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  if (line) ctx.lineWidth = line;
  if (stroke) ctx.strokeStyle = stroke;
  if (line || stroke) ctx.strokeText(text, x, y, restrict);
  ctx.fillStyle = gradient ? gradient : color;
  ctx.fillText(text, x, y, restrict);
  ctx.restore();
}

export function cutData(data = [], start = 0) {
  const index = data.findIndex(([t]) => t >= start);
  if (index <= 0) return data;
  const slice = data.slice(index);
  if (data[index][0] === start) return slice;
  const [prevTime, prevValue] = data[index - 1];
  const [nextTime, nextValue] = data[index];
  const ratio = (start - prevTime) / (nextTime - prevTime);
  let value = prevValue + ratio * (nextValue - prevValue);
  slice.unshift([start, value]);
  return slice;
}

export function drawRect(ctx, [[x1, y1], [x2, y2]], { fill = "white" } = {}) {
  ctx.save();
  ctx.fillStyle = fill;
  ctx.fillRect(x1, y1, x2, y2);
  ctx.restore();
}

export function drawLine(ctx, [[x1, y1], [x2, y2]], { color, line } = {}) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = line;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

export function drawArc(ctx, [x, y], { radius, start, end, color, line } = {}) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = line;
  ctx.beginPath();
  ctx.arc(x, y, radius, (start / 180) * Math.PI, (end / 180) * Math.PI);
  ctx.stroke();
  ctx.restore();
}

export function drawPolyline(ctx, points, { filled = false } = {}) {
  ctx.save();
  if (filled) {
    const x1 = points[0][0];
    const x2 = points[points.length - 1][0];
    const x = (x1 + x2) / 2;
    const allY = points.map(([_, y]) => y);
    const y1 = Math.min(...allY);
    const y2 = Math.max(...allY) + ctx.lineWidth;
    const gradient = ctx.createLinearGradient(x, y1, x, y2);
    gradient.addColorStop(0, "rgba(255, 255, 0, 0.4)");
    gradient.addColorStop(1, "rgba(255, 0, 0, 0)");
    ctx.fillStyle = gradient;
    points = [[x1, y2], ...points, [x2, y2]];
  }
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i][0], points[i][1]);
  }
  filled ? ctx.fill() : ctx.stroke();
  ctx.restore();
}

export function drawBorder(
  ctx,
  [[x1, y1], [x2, y2]],
  { radius = 24, color = "white", line = 3 } = {}
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

export function getMousePos(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) * canvas.width) / rect.width,
    y: ((event.clientY - rect.top) * canvas.height) / rect.height,
  };
}

export function addDays(dirtyDate, amount) {
  const date = new Date(dirtyDate);
  if (!amount) return date;
  date.setDate(date.getDate() + amount);
  return date;
}

export function subDays(dirtyDate, amount) {
  return addDays(dirtyDate, -amount);
}

export function startOfDay(dirtyDate) {
  const date = new Date(dirtyDate);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function endOfDay(dirtyDate) {
  const date = new Date(dirtyDate);
  date.setHours(23, 59, 59, 999);
  return date;
}

export function debounce(func, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
}

export function throttle(cb, delay) {
  let wait = false;
  return (...args) => {
    if (wait) return;
    cb(...args);
    wait = true;
    setTimeout(() => (wait = false), delay);
  };
}

function isDeno() {
  return typeof Deno !== "undefined";
}
