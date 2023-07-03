let drawImage = (ctx, [x, y], img) => {
  ctx.drawImage(img, x, y);
};

export function registerDrawImage(di) {
  drawImage = di;
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

export function drawChart(ctx, points = []) {
  if (!points || points.length < 1) return;
  ctx.save();
  ctx.lineJoin = "round";
  drawPolyline(ctx, points, { filled: true });
  ctx.strokeStyle = "#51276C";
  ctx.lineWidth = 5;
  drawPolyline(ctx, points);
  ctx.strokeStyle = "yellow";
  ctx.lineWidth = 2;
  drawPolyline(ctx, points);
  ctx.restore();
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
  ctx.strokeStyle = "#51276C";
  ctx.lineWidth = 6;
  drawPolyline(ctx, dash1);
  drawPolyline(ctx, dash2);
  drawPolyline(ctx, dash3);
  drawPolyline(ctx, dash4);
  ctx.strokeStyle = "red";
  ctx.lineWidth = 3;
  drawPolyline(ctx, dash1);
  drawPolyline(ctx, dash2);
  drawPolyline(ctx, dash3);
  drawPolyline(ctx, dash4);
  ctx.restore();
}

export function drawRuler(
  ctx,
  [[x1, y1], [x2, y2]],
  { timeframe, color = "black", line = 2 } = {}
) {
  const segment = timeframe === "weekly" ? 7 : 11;
  const step = (x2 - x1) / segment;
  let day = new Date();
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
    if (timeframe === "monthly") day = subDays(day, 1);
    let month = day.getMonth() + 1;
    month = month < 10 ? "0" + month : month;
    let date = day.getDate();
    date = date < 10 ? "0" + date : date;
    day = subDays(day, timeframe === "weekly" ? 1 : 2);
    let x = lineX - step / 2;
    x = denoFix(x, month, date);
    const opts = { color, size: 14, restrict: 38 };
    if (timeframe === "weekly") {
      const text = month + "." + date;
      drawText(ctx, [x, y1 + 7], { ...opts, text });
      drawText(ctx, [x, y2 - 5], { ...opts, text });
    } else {
      drawText(ctx, [x, y1 + 7], { ...opts, text: month });
      drawText(ctx, [x, y2 - 5], { ...opts, text: month });
      drawText(ctx, [x, y1 + 19], { ...opts, text: date });
      drawText(ctx, [x, y2 - 17], { ...opts, text: date });
    }
  }
}

function denoFix(x, month, date) {
  if (typeof Deno === "undefined") return x;
  if (month.toString().includes("1") || date.toString().includes("1")) return x;
  return x + 2;
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

export function drawText(
  ctx,
  [x, y],
  {
    text,
    align = "center",
    color = "white",
    font = "sora",
    gradient = false,
    size = 20,
    restrict,
  } = {}
) {
  ctx.save();
  if (gradient) {
    const padding = size / 2.5;
    gradient = ctx.createLinearGradient(x, y - padding, x, y + padding);
    gradient.addColorStop(0, "yellow");
    gradient.addColorStop(1, "red");
  }
  ctx.fillStyle = gradient ? gradient : color;
  ctx.font = size + "px " + font;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y, restrict);
  ctx.restore();
}

export function drawToken(ctx, [x, y], token) {
  token = token.toString().toUpperCase();
  const size = {
    3: 64,
    4: 56,
    5: 48,
    6: 44,
  }[token.length];
  drawText(ctx, [x, y - 24 / size], {
    text: token.toUpperCase(),
    align: "right",
    size,
  });
}

export function drawValue(ctx, [x, y], value = 0) {
  drawText(ctx, [x, y || 144], {
    text: addSeparator(value),
    gradient: true,
    size: 36,
  });
}

export function drawDetails(
  ctx,
  [[x1, y1], [x2, y2]],
  { data = [], timeframe, crossVisible = true, minMaxVisible = true } = {}
) {
  const padding = 48;
  drawRuler(
    ctx,
    [
      [x1, y1 + padding],
      [x2, y2 - padding],
    ],
    { timeframe }
  );
  const now = Date.now();
  const start = startOfDay(
    subDays(now, timeframe === "weekly" ? 6 : 32)
  ).valueOf();
  const end = endOfDay(now).valueOf();
  const step = (x2 - x1) / (end - start);
  const cutted = cutData(data, start);
  const min = cutted.length > 0 ? Math.min(...cutted.map(([_, v]) => v)) : 0;
  const max = cutted.length > 0 ? Math.max(...cutted.map(([_, v]) => v)) : 0;
  if (minMaxVisible) {
    const textX = (x1 + x2) / 2;
    drawText(ctx, [textX, y1 + 24], {
      text: addSeparator(max),
    });
    drawText(ctx, [textX, y2 - 24], {
      text: addSeparator(min),
    });
  }
  const chartPadding = padding + (timeframe === "weekly" ? 0 : 8);
  const height = y2 - y1 - 3 * chartPadding;
  const points = cutted.map(([t, v]) => [
    x1 + (t - start) * step,
    min === max
      ? (y1 + y2) / 2
      : y1 + 1.5 * chartPadding + height - (height * (v - min)) / (max - min),
  ]);
  drawChart(ctx, points);
  drawBorder(ctx, [
    [x1 - 2, y1 - 2],
    [x2 + 2, y2 + 2],
  ]);
  if (crossVisible && points.length > 0) {
    drawCross(ctx, points[points.length - 1]);
  }
  return { cutted, points };
}

export function drawCard(
  ctx,
  [[x1, y1], [x2, y2]],
  {
    token = "",
    data = [],
    icon,
    timeframe = "weekly",
    crossVisible = true,
    valueVisible = true,
  } = {}
) {
  const padding = 32;
  drawRect(
    ctx,
    [
      [x1, y1],
      [x2, y2],
    ],
    {
      fill: "#51276C",
    }
  );
  if (icon) drawImage(ctx, [padding, padding], icon);
  drawBorder(
    ctx,
    [
      [padding - 1, padding - 1],
      [padding + 81, padding + 81],
    ],
    { radius: 40 }
  );
  if (token) drawToken(ctx, [x2 - padding, 72], token);
  if (valueVisible && data.length > 0) {
    const value = data[data.length - 1][1];
    if (value) drawValue(ctx, [(x2 - x1) / 2, 144], value);
  }
  return drawDetails(
    ctx,
    [
      [padding, 180],
      [x2 - padding, y2 - padding],
    ],
    {
      data,
      timeframe,
      crossVisible,
      minMaxVisible: data.length > 0,
    }
  );
}

export function drawPreview(ctx, [[x1, y1], [x2, y2]], { tokens = [] } = {}) {
  drawRect(
    ctx,
    [
      [x1, y1],
      [x2, y2],
    ],
    {
      fill: "#51276C",
    }
  );
  tokens.forEach((token, idx) => {
    drawImage(ctx, [30 + idx * (360 + 30), 0], "./images/" + token + ".png");
  });
}

export function getMousePos(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) * canvas.width) / rect.width,
    y: ((event.clientY - rect.top) * canvas.height) / rect.height,
  };
}

export function addSeparator(text) {
  return new Intl.NumberFormat("en-US").format(text);
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

export function formatDateString(timestamp) {
  const formatZero = (value) => (value < 10 ? "0" + value : value.toString());
  const time = new Date(timestamp);
  const year = time.getFullYear();
  const month = formatZero(time.getMonth() + 1);
  const date = formatZero(time.getDate());
  const hour = formatZero(time.getHours());
  const minutes = formatZero(time.getMinutes());
  return (
    "[ " + year + "." + month + "." + date + " | " + hour + ":" + minutes + " ]"
  );
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
  value = Math.round(value);
  slice.unshift([start, value]);
  return slice;
}

export function debounce(func, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
}

export function throttle(func, delay) {
  let wait = false;
  return (...args) => {
    if (wait) return;
    func(...args);
    wait = true;
    setTimeout(() => (wait = false), delay);
  };
}
