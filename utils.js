let drawImage = () => {};

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
    const x2 = points.at(-1)[0];
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

export function drawChart(ctx, points) {
  ctx.save();
  ctx.lineJoin = "round";
  ctx.strokeStyle = "yellow";
  ctx.lineWidth = 2;
  drawPolyline(ctx, points);
  drawPolyline(ctx, points, { filled: true });
  const [x, y] = points.at(-1);
  const arrow = [
    [x - 24, y + 2],
    [x, y],
    [x - 24, y - 2],
  ];
  ctx.strokeStyle = "#492067";
  ctx.lineWidth = 6;
  drawPolyline(ctx, arrow);
  ctx.strokeStyle = "red";
  ctx.lineWidth = 3;
  drawPolyline(ctx, arrow);
  ctx.restore();
}

export function drawRuler(
  ctx,
  [[x1, y1], [x2, y2]],
  { segment = 7, color = "rgba(0, 0, 0, 0.6)", line = 2 } = {}
) {
  const step = (x2 - x1) / segment;
  let day = new Date();
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
    const month = day.getMonth() + 1;
    const date = day.getDate();
    day = subDays(day, 1);
    const opts = {
      text:
        (month < 10 ? "0" + month : month) +
        "." +
        (date < 10 ? "0" + date : date),
      color,
      size: 14,
    };
    drawText(ctx, [x - step / 2, y1 + 6], opts);
    drawText(ctx, [x - step / 2, y2 - 6], opts);
    if (i !== 1) continue;
    drawLine(
      ctx,
      [
        [x1, y1],
        [x1, y2],
      ],
      {
        color,
        line,
      }
    );
  }
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
  { text, align = "center", color = "white", gradient = false, size = 20 } = {}
) {
  ctx.save();
  if (gradient) {
    const padding = size / 2.5;
    gradient = ctx.createLinearGradient(x, y - padding, x, y + padding);
    gradient.addColorStop(0, "yellow");
    gradient.addColorStop(1, "red");
  }
  ctx.fillStyle = gradient ? gradient : color;
  ctx.font = size + "px sora";
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
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

export function drawDetails(ctx, [[x1, y1], [x2, y2]], data = []) {
  const padding = 48;
  const now = Date.now();
  const start = startOfDay(subDays(now, 6)).valueOf();
  const end = endOfDay(now).valueOf();
  const step = (x2 - x1) / (end - start);
  const weekly = cutData(data, start);
  const min = weekly.length > 0 ? Math.min(...weekly.map(([_, v]) => v)) : 0;
  const max = weekly.length > 0 ? Math.max(...weekly.map(([_, v]) => v)) : 0;
  const height = y2 - y1 - 3 * padding;
  const points = weekly.map(([t, v]) => [
    x1 + (t - start) * step,
    min === max
      ? (y1 + y2) / 2
      : y1 + 1.5 * padding + height - (height * (v - min)) / (max - min),
  ]);
  drawRuler(ctx, [
    [x1, y1 + padding],
    [x2, y2 - padding],
  ]);
  drawText(ctx, [(x1 + x2) / 2, y1 + 24], {
    text: addSeparator(max),
  });
  drawText(ctx, [(x1 + x2) / 2, y2 - 24], {
    text: addSeparator(min),
  });
  drawChart(ctx, points);
  drawBorder(ctx, [
    [x1, y1],
    [x2, y2],
  ]);
  return {
    qty: addSeparator(weekly.at(-1)?.[1] || 0),
    min: addSeparator(min),
    max: addSeparator(max),
  };
}

export function drawCart(ctx, [[x1, y1], [x2, y2]], { token, data, icon }) {
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
  drawImage(ctx, [padding, padding], icon);
  drawBorder(
    ctx,
    [
      [padding, padding],
      [padding + 80, padding + 80],
    ],
    { radius: 40, line: 3 }
  );
  drawToken(ctx, [x2 - padding, 72], token);
  drawText(ctx, [(x2 - x1) / 2, 144], {
    text: addSeparator(data.at(-1)?.[1] || 0),
    gradient: true,
    size: 36,
  });
  return drawDetails(
    ctx,
    [
      [padding, 180],
      [x2 - padding, y2 - padding],
    ],
    data
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
      fill: "#492067",
    }
  );
  tokens.forEach((token, idx) => {
    drawImage(ctx, [45 + idx * (360 + 15), 0], "./images/" + token + ".png");
  });
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

export function cutData(data, start) {
  const filtered = data.filter(([t]) => t > start);
  const index = data.findLastIndex(([t]) => t <= start);
  if (index > -1) {
    const prev = data[index];
    const next = data[index + 1];
    const ratio = (start - prev[0]) / (next[0] - prev[0]);
    const value = prev[1] + ratio * (next[1] - prev[1]);
    filtered.unshift([start, Math.round(value)]);
  }
  return filtered;
}
