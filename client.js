import {
  drawCard,
  drawCross,
  drawValue,
  getMousePos,
  formatDateString,
} from "./utils.js";

const documentEl = document.documentElement;
const timeframeEl = document.querySelector("a#timeframe");
const h2El = document.querySelector("h2");
const contentEl = document.querySelector("content");

const updateRem = () => {
  documentEl.style.setProperty("font-size", window.innerHeight * 0.01 + "px");
};

updateRem();

window.addEventListener("resize", updateRem);

window.addEventListener("wheel", ({ deltaX, deltaY }) => {
  documentEl.scrollLeft += deltaX + deltaY;
});

window.addEventListener("keydown", ({ key }) => {
  switch (key) {
    case "Home":
      return (documentEl.scrollLeft = 0);
    case "PageUp":
      return (documentEl.scrollLeft -= 0.9 * documentEl.clientWidth);
    case "PageDown":
      return (documentEl.scrollLeft += 0.9 * documentEl.clientWidth);
    case "End":
      return (documentEl.scrollLeft = documentEl.scrollWidth);
  }
});

let timeframe =
  localStorage.getItem("timeframe") === "monthly" ? "monthly" : "weekly";

timeframeEl.innerText = timeframe;

timeframeEl.addEventListener("click", (event) => {
  event.preventDefault();
  timeframe = timeframe === "weekly" ? "monthly" : "weekly";
  localStorage.setItem("timeframe", timeframe);
  timeframeEl.innerText = timeframe;
  tokens.forEach((token) => drawUnderlay({ token }).then(drawOverlay));
});

const tokens = [];
const dataset = {};
const canvases = {};
const icons = {};
const cuttedset = {};
const pointsset = {};
const underlays = {};
const links = {};

fetchTokens().then((value) => {
  tokens.push(...value);
  createCards();
  checkTimestamp();
  setInterval(() => checkTimestamp(), 10000);
});

function createCards() {
  if (!tokens || tokens.length < 1) return;
  tokens.forEach((token) => {
    const canvas = document.createElement("canvas");
    canvases[token] = canvas;
    canvas.width = 360;
    canvas.height = 630;
    canvas.addEventListener("mousemove", updateOverlay(token), false);
    canvas.addEventListener("mouseleave", resetOverlay(token), false);
    const link = document.createElement("a");
    links[token] = link;
    link.href = "https://mof.sora.org/qty/" + token;
    link.title = "[view source]";
    link.innerText = token;
    const container = document.createElement("div");
    container.appendChild(canvas);
    container.appendChild(link);
    contentEl.appendChild(container);
    const icon = document.createElement("img");
    icons[token] = icon;
    icon.src = "./images/icons/" + token + ".png";
    icon.addEventListener("load", () => {
      fetchData(token).then(drawUnderlay).then(drawOverlay);
    });
  });
}

function updateOverlay(token) {
  const canvas = canvases[token];
  const context = canvas.getContext("2d");
  let timeout;
  return (event) => {
    if (timeout) window.cancelAnimationFrame(timeout);
    timeout = window.requestAnimationFrame(() => {
      if (underlays[token]) context.putImageData(underlays[token], 0, 0);
      const cutted = cuttedset[token] || [];
      const points = pointsset[token] || [];
      if (cutted.length < 1 || points.length < 1) return;
      const { x, y } = getMousePos(canvas, event);
      if (x < 0 || y < 228 || x > 360 || y > 556) {
        return drawOverlay({
          token,
          value: cutted[cutted.length - 1][1] || 0,
          cross: points[points.length - 1],
          timestamp: cutted[cutted.length - 1][0],
        });
      }
      const [left, right] = findIndexes(points, x);
      const [leftTime] = cutted[left];
      const [rightTime, rightValue] = cutted[right];
      const [leftX] = points[left];
      const [rightX, rightY] = points[right];
      const value = rightValue;
      let crossX = x;
      if (x < points[0][0]) {
        crossX = points[0][0];
      }
      if (x > points[points.length - 1][0]) {
        crossX = points[points.length - 1][0];
      }
      const cross = [crossX, rightY];
      let ratio = (x - leftX) / (rightX - leftX);
      if (ratio < 0) ratio = 0;
      if (ratio > 1) ratio = 1;
      const timestamp = leftTime + ratio * (rightTime - leftTime);
      drawOverlay({ token, value, cross, timestamp });
    });
  };
}

function findIndexes(points = [], x = 0) {
  const lastIndex = points.length - 1;
  let low = 0;
  let high = points.length - 1;
  while (low <= high) {
    const index = (low + high) >>> 1;
    const item = points[index];
    if (item === undefined) return [lastIndex, lastIndex];
    const value = item[0];
    if (value < x) low = index + 1;
    else if (value > x) high = index - 1;
    else return [index, index];
  }
  if (low < 1) return [0, 0];
  if (low > lastIndex) return [lastIndex, lastIndex];
  return [low - 1, low];
}

function resetOverlay(token) {
  return () => {
    drawUnderlay({ token }).then(drawOverlay);
  };
}

function fetchTokens() {
  return fetch("./tokens.json", { cache: "reload" })
    .then((response) => response.text())
    .then(JSON.parse)
    .catch(() => {
      setTimeout(() => {
        window.location = window.location;
      }, 1000);
      return [];
    });
}

function checkTimestamp() {
  fetch("./timestamp.json", { cache: "reload" })
    .then((response) => response.text())
    .then(JSON.parse)
    .catch(() => {})
    .then((timestamp) => {
      h2El.innerText =
        "last update: " +
        (timestamp
          ? Math.round((Date.now() - timestamp) / 60000) + "m ago"
          : "N/A");
      if (!timestamp || timestamp === checkTimestamp.timestamp) return;
      if (checkTimestamp.timestamp && tokens) {
        tokens.forEach((token) => {
          fetchData(token).then(drawUnderlay).then(drawOverlay);
        });
      }
      checkTimestamp.timestamp = timestamp;
    });
}

function fetchData(token) {
  return fetch("./data/monthly/" + token + ".json", {
    cache: "reload",
  })
    .then((response) => response.text())
    .then(JSON.parse)
    .catch(() => [])
    .then((data) => ((dataset[token] = data), { token, data }));
}

async function drawUnderlay({ token, data = dataset[token] } = {}) {
  const canvas = canvases[token];
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const icon = icons[token];
  const { cutted, points } = drawCard(
    context,
    [
      [0, 0],
      [canvas.width, canvas.height],
    ],
    { token, data, icon, timeframe, valueVisible: false, crossVisible: false }
  );
  cuttedset[token] = cutted;
  pointsset[token] = points;
  underlays[token] = context.getImageData(0, 0, canvas.width, canvas.height);
  let value, cross, timestamp;
  if (cutted.length) {
    value = cutted[cutted.length - 1][1];
    cross = points[points.length - 1];
    timestamp = cutted[cutted.length - 1][0];
  }
  return {
    token,
    canvas,
    context,
    value,
    cross,
    timestamp,
  };
}

function drawOverlay({
  token,
  canvas = canvases[token],
  context = canvas.getContext("2d"),
  value = 0,
  cross = [],
  timestamp = 0,
}) {
  drawValue(context, [180, 144], value);
  drawCross(context, cross);
  if (!timestamp) return;
  const link = links[token];
  link.innerText = formatDateString(timestamp);
}
