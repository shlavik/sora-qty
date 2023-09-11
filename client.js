import {
  drawCard,
  drawCross,
  drawValue,
  formatDateString,
  getMousePos,
  debounce,
} from "./utils.js";

const appEl = document.documentElement.querySelector("app");
const headerEl = appEl.querySelector("header");
const timeframeEl = headerEl.querySelector("timeframe");
const timeframeLinks = timeframeEl.querySelectorAll("a");
const overlayEl = headerEl.querySelector("overlay");
const handleEl = overlayEl.querySelector("handle");
const dropdownEl = overlayEl.querySelector("dropdown");
const dropdownLinks = dropdownEl.querySelectorAll("a");
const updateEl = dropdownEl.querySelector("update");
const contentEl = appEl.querySelector("content");

function updateRem() {
  setTimeout(() => {
    document.documentElement.style.setProperty(
      "font-size",
      0.01 * document.documentElement.clientHeight + "px"
    );
    appEl.scrollLeft = 0;
  });
}

updateRem();

addEventListener("resize", updateRem);

function getScroll() {
  const { clientWidth, scrollLeft, scrollWidth } = appEl;
  return Math.round((scrollLeft / (scrollWidth - clientWidth)) * 100000000);
}

const updateLocalStorageScrollDebounced = debounce(
  () => localStorage.setItem("scroll", getScroll()),
  64
);

appEl.addEventListener("scroll", () => {
  closeDropdown();
  updateLocalStorageScrollDebounced();
});

addEventListener("wheel", (event) => {
  const { deltaX, deltaY } = event;
  appEl.scrollLeft += deltaX + 2 * deltaY;
});

addEventListener("keydown", (event) => {
  switch (event.key) {
    case "ArrowLeft":
      event.preventDefault();
      return (appEl.scrollLeft -= 0.2 * appEl.clientWidth);
    case "ArrowRight":
      event.preventDefault();
      return (appEl.scrollLeft += 0.2 * appEl.clientWidth);
    case "ArrowUp":
      event.preventDefault();
      return (appEl.scrollLeft -= 0.4 * appEl.clientWidth);
    case "ArrowDown":
      event.preventDefault();
      return (appEl.scrollLeft += 0.4 * appEl.clientWidth);
    case "Home":
      return (appEl.scrollLeft = 0);
    case "PageUp":
      return (appEl.scrollLeft -= 0.8 * appEl.clientWidth);
    case "PageDown":
      return (appEl.scrollLeft += 0.8 * appEl.clientWidth);
    case "End":
      return (appEl.scrollLeft = appEl.scrollWidth);
  }
});

function isDropdownOpened() {
  return overlayEl.classList.contains("opened");
}

function openDropdown() {
  overlayEl.classList.add("opened");
  overlayEl.classList.remove("closing");
}

function closeDropdown() {
  if (!isDropdownOpened()) return;
  overlayEl.classList.remove("opened");
  overlayEl.classList.add("closing");
}

function toggleDropdown() {
  isDropdownOpened() ? closeDropdown() : openDropdown();
}

appEl.addEventListener("click", () => {
  if (isDropdownOpened()) closeDropdown();
});

overlayEl.addEventListener("click", (event) => {
  event.stopPropagation();
});

handleEl.addEventListener("click", () => {
  toggleDropdown();
});

dropdownEl.addEventListener("animationend", () => {
  overlayEl.classList.remove("closing");
});

addEventListener("keydown", (event) => {
  if (event.code === "Escape") {
    closeDropdown();
    handleEl.focus();
    return;
  }
  if (event.code === "Tab") {
    const lastTimeframeLink = timeframeLinks[timeframeLinks.length - 1];
    const lastDropdownLink = dropdownLinks[dropdownLinks.length - 1];
    if (event.target === lastTimeframeLink && !event.shiftKey) {
      openDropdown();
    } else if (event.target === lastDropdownLink && !event.shiftKey) {
      closeDropdown();
    } else if (handleEl.contains(event.target)) {
      event.shiftKey ? closeDropdown() : openDropdown();
    }
  }
  if (!handleEl.contains(event.target)) return;
  if (event.code !== "Enter" && event.code !== "Space") return;
  toggleDropdown();
});

dropdownLinks[dropdownLinks.length - 1].addEventListener("focus", () => {
  openDropdown();
});

let timeframe =
  {
    "1w": "1w",
    "1m": "1m",
    "3m": "3m",
    "1y": "1y",
  }[localStorage.getItem("timeframe")] || "1w";
timeframeEl.dataset.timeframe = timeframe;

timeframeEl.addEventListener("click", (event) => {
  event.preventDefault();
  if (!event.target.id) return;
  timeframe = event.target.id;
  timeframeEl.dataset.timeframe = timeframe;
  localStorage.setItem("timeframe", timeframe);
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

const hiddenTokens = [
  "ceres",
  "deo",
  "hmx",
  "busd",
  "tusd",
  "frax",
  "lusd",
  "husd",
  "soshiba",
];

fetchTokens().then((value) => {
  tokens.push(...value.filter((token) => !hiddenTokens.includes(token)));
  createCards();
  checkTimestamp();
  setInterval(() => checkTimestamp(), 10000);
});

function createCard(token) {
  const canvas = document.createElement("canvas");
  canvases[token] = canvas;
  canvas.width = 360;
  canvas.height = 630;
  canvas.addEventListener("mousemove", updateOverlay(token), false);
  canvas.addEventListener("mouseleave", resetOverlay(token), false);
  const link = document.createElement("a");
  links[token] = link;
  link.className = "source";
  link.href = "https://mof.sora.org/qty/" + token;
  link.target = "_blank";
  link.title = "[view source]";
  link.innerText = token.toUpperCase();
  const container = document.createElement("card");
  container.appendChild(canvas);
  container.appendChild(link);
  contentEl.appendChild(container);
  const icon = document.createElement("img");
  icons[token] = icon;
  icon.src = "./images/icons/" + token + ".png";
  icon.addEventListener("load", () => {
    drawUnderlay({ token });
    fetchData(token).then(drawUnderlay).then(drawOverlay);
  });
}

function createCards() {
  if (!tokens || tokens.length < 1) return;
  contentEl.className = timeframe;
  tokens.forEach(createCard);
  const scroll = Number(localStorage.getItem("scroll")) || 0;
  if (scroll === 0) return;
  const { clientWidth, scrollWidth } = appEl;
  setTimeout(() => {
    const scrollLeft = Math.round(
      ((scrollWidth - clientWidth) * scroll) / 100000000
    );
    appEl.scrollLeft = scrollLeft;
  });
}

function isPeak(index, array) {
  const prev = array[index - 1] ? array[index - 1][1] : null;
  const cur = array[index] ? array[index][1] : null;
  const next = array[index + 1] ? array[index + 1][1] : null;
  return (cur > prev && cur > next) || (cur < prev && cur < next);
}

function findNearestPeak(index, array, timeRange) {
  const currentTime = array[index][0];
  let nearestPeakIndex = null;
  let nearestPeakTimeDiff = Number.MAX_SAFE_INTEGER;
  for (let i = 1; i < array.length; i++) {
    for (const direction of [-1, 1]) {
      const targetIndex = index + i * direction;
      if (targetIndex <= 0 || targetIndex >= array.length) continue;
      const [time] = array[targetIndex];
      const timeDiff = Math.abs(currentTime - time);
      if (timeDiff > timeRange) continue;
      if (isPeak(targetIndex, array) && timeDiff < nearestPeakTimeDiff) {
        nearestPeakIndex = targetIndex;
        nearestPeakTimeDiff = timeDiff;
      }
    }
    if (nearestPeakIndex !== null) break;
  }
  return nearestPeakIndex;
}

function findIndexes(points = [], x = 0) {
  if (points.length === 0) return [-1, -1];
  const lastIndex = points.length - 1;
  let low = 0;
  let high = lastIndex;
  while (low <= high) {
    const index = (low + high) >>> 1;
    const value = points[index][0];
    if (value < x) {
      low = index + 1;
    } else if (value > x) {
      high = index - 1;
    } else {
      return [index, index];
    }
  }
  if (low < 1) return [0, 0];
  if (low > lastIndex) return [lastIndex, lastIndex];
  return [low - 1, low];
}

function updateOverlay(token) {
  const canvas = canvases[token];
  const context = canvas.getContext("2d");
  let timeout;
  return (event) => {
    if (timeout) cancelAnimationFrame(timeout);
    timeout = requestAnimationFrame(() => {
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
      const [leftTime, leftValue] = cutted[left];
      const [rightTime, rightValue] = cutted[right];
      const [leftX, leftY] = points[left];
      const [rightX, rightY] = points[right];
      let value, crossX, crossY, timestamp;
      const timeRange =
        {
          "1w": 30 * 60 * 1000,
          "1m": 150 * 60 * 1000,
        }[timeframe] || 0;
      const nearestPeakIndex = findNearestPeak(left, cutted, timeRange);
      if (nearestPeakIndex !== null) {
        const [peakTime, peakValue] = cutted[nearestPeakIndex];
        const [peakX, peakY] = points[nearestPeakIndex];
        value = peakValue;
        crossX = peakX;
        crossY = peakY;
        timestamp = peakTime;
      } else {
        let ratio = (x - leftX) / (rightX - leftX);
        if (ratio < 0) ratio = 0;
        if (ratio > 1) ratio = 1;
        value = leftValue + ratio * (rightValue - leftValue);
        crossX = x;
        if (x < points[0][0]) {
          crossX = points[0][0];
        }
        if (x > points[points.length - 1][0]) {
          crossX = points[points.length - 1][0];
        }
        crossY = leftY + ratio * (rightY - leftY);
        timestamp = leftTime + ratio * (rightTime - leftTime);
      }
      drawOverlay({ token, value, cross: [crossX, crossY], timestamp });
    });
  };
}

function resetOverlay(token) {
  return () => drawUnderlay({ token }).then(drawOverlay);
}

function fetchTokens() {
  return fetch("./tokens.json", { cache: "reload" })
    .then((response) => response.text())
    .then(JSON.parse)
    .catch(() => {
      setTimeout(() => (window.location = location), 1000);
      return [];
    });
}

function checkTimestamp() {
  fetch("./timestamp.json", { cache: "reload" })
    .then((response) => response.text())
    .then(JSON.parse)
    .catch(() => {})
    .then((timestamp) => {
      updateEl.innerText = timestamp
        ? Math.round((Date.now() - timestamp) / 60000) + "m ago"
        : "N/A";
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
    { token, data, icon, timeframe, crossVisible: false, valueVisible: false }
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
  value,
  cross = [],
  timestamp = 0,
}) {
  if (value >= 0) drawValue(context, [180, 144], value);
  drawCross(context, cross);
  if (!timestamp) return;
  const link = links[token];
  link.innerText = formatDateString(timestamp);
}
