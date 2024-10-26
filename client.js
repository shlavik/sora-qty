import {
  cardHeight,
  cardWidth,
  debounce,
  drawCard,
  drawCross,
  drawValue,
  getMousePos,
} from "./core.js";

const MODES = {
  xor: "xor",
  ken: "ken",
  xst: "xst",
};
const TIMEFRAMES = {
  week: "week",
  month: "month",
  year: "year",
};

let tokens = {};
let dataset = {};
const cuttedset = {};
const pointsset = {};
const underlays = {};

const appEl = document.documentElement.querySelector("app");
const headerEl = appEl.querySelector("header");
const modeEl = headerEl.querySelector("mode");
const timeframeEl = headerEl.querySelector("timeframe");
const timeframeLinks = timeframeEl.querySelectorAll("a");
const overlayEl = headerEl.querySelector("overlay");
const handleEl = overlayEl.querySelector("handle");
const dropdownEl = overlayEl.querySelector("dropdown");
const dropdownLinks = dropdownEl.querySelectorAll("a");
const updateEl = dropdownEl.querySelector("update");
const contentEl = appEl.querySelector("content");
const screenEl = appEl.querySelector("screen");

function getScroll() {
  const { clientWidth, scrollLeft, scrollWidth } = appEl;
  return Math.round((1e8 * scrollLeft) / (scrollWidth - clientWidth));
}

const updateLocalStorageScrollDebounced = debounce(
  () => localStorage.setItem("scroll", getScroll()),
  64
);

appEl.addEventListener("scroll", () => {
  updateLocalStorageScrollDebounced();
});

addEventListener("wheel", (event) => {
  const { deltaX, deltaY } = event;
  appEl.scrollLeft += deltaX + 2 * deltaY;
});

addEventListener("keydown", (event) => {
  if (event.shiftKey && event.code === "Space") {
    return (appEl.scrollLeft -= 0.8 * appEl.clientWidth);
  }
  switch (event.code) {
    case "Digit1":
      return setTimeframe(TIMEFRAMES.week);
    case "Digit2":
      return setTimeframe(TIMEFRAMES.month);
    case "Digit3":
      return setTimeframe(TIMEFRAMES.year);
    case "KeyQ":
      return setMode(MODES.xor);
    case "KeyW":
      return setMode(MODES.ken);
    case "KeyE":
      return setMode(MODES.xst);
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
    case "Space":
      return (appEl.scrollLeft += 0.8 * appEl.clientWidth);
    case "End":
      return (appEl.scrollLeft = appEl.scrollWidth);
  }
});

function isDropdownOpened() {
  return overlayEl.classList.contains("opened");
}

function openDropdown() {
  if (isDropdownOpened()) return;
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
  if (event.code === "Escape" && isDropdownOpened()) {
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

let mode = MODES[localStorage.getItem("mode")] || MODES.xor;
modeEl.dataset.mode = mode;

function setMode(key) {
  if (key === mode) return;
  mode = MODES[key] || MODES.xor;
  modeEl.dataset.mode = mode;
  localStorage.setItem("mode", mode);
  screenEl.style.animation = "none";
  screenEl.offsetHeight;
  screenEl.style.animation = null;
  while (contentEl.firstChild) {
    contentEl.removeChild(contentEl.lastChild);
  }
  createCards();
}

modeEl.addEventListener("click", (event) => {
  event.preventDefault();
  if (!event.target.id) return;
  if (mode === event.target.id) return;
  setMode(event.target.id);
});

let timeframe =
  TIMEFRAMES[localStorage.getItem("timeframe")] || TIMEFRAMES.month;
timeframeEl.dataset.timeframe = timeframe;

function setTimeframe(key) {
  if (key === timeframe) return;
  timeframe = TIMEFRAMES[key] || TIMEFRAMES.month;
  timeframeEl.dataset.timeframe = timeframe;
  localStorage.setItem("timeframe", timeframe);
  tokens[mode].forEach(resetLays);
}

timeframeEl.addEventListener("click", (event) => {
  event.preventDefault();
  if (!event.target.id) return;
  setTimeframe(event.target.id);
});

(function resetLaysAtMidnight() {
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const untilMidnight = midnight - Date.now();
  setTimeout(() => {
    tokens[mode].forEach(resetLays);
    setInterval(() => {
      tokens[mode].forEach(resetLays);
    }, 24 * 60 * 60 * 1000);
  }, untilMidnight);
})();

function fetchTokens() {
  return fetch("./tokens.json", { cache: "reload" })
    .then((response) => response.text())
    .then(JSON.parse)
    .catch(() => {
      setTimeout(() => (window.location = location), 1000);
      return [];
    });
}

fetchTokens().then((value) => {
  tokens = value;
  createCards();
  checkTimestamp();
  setInterval(() => checkTimestamp(), 10000);
});

function fetchData(token, reload) {
  return fetch(
    "./data/prepared/" + token + ".json",
    reload
      ? {
          cache: "reload",
        }
      : undefined
  )
    .then((response) => response.text())
    .then(JSON.parse)
    .catch(() => [])
    .then((data) => ((dataset[token] = data), token));
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
      if (checkTimestamp.timestamp) {
        dataset = {};
        tokens[mode].forEach((token) => fetchData(token, true).then(resetLays));
      }
      checkTimestamp.timestamp = timestamp;
    });
}

function getCanvasEl(token) {
  if (!getCanvasEl.cache) getCanvasEl.cache = {};
  if (getCanvasEl.cache[token]) return getCanvasEl.cache[token];
  const canvasEl = document.createElement("canvas");
  canvasEl.width = cardWidth;
  canvasEl.height = cardHeight;
  canvasEl.addEventListener("mousemove", createUpdateOverlay(token, canvasEl));
  canvasEl.addEventListener("mouseleave", () => resetLays(token));
  getCanvasEl.cache[token] = canvasEl;
  return canvasEl;
}

function getIconEl(token) {
  if (!getIconEl.cache) getIconEl.cache = {};
  if (getIconEl.cache[token]) return getIconEl.cache[token];
  const iconEl = document.createElement("img");
  iconEl.src = "./images/icons/" + token + ".png";
  iconEl.addEventListener("load", () => resetLays(token));
  getIconEl.cache[token] = iconEl;
  return iconEl;
}

function getLinkEl(token) {
  if (!getLinkEl.cache) getLinkEl.cache = {};
  if (getLinkEl.cache[token]) return getLinkEl.cache[token];
  const linkEl = document.createElement("a");
  linkEl.className = "source";
  linkEl.href = "https://mof.sora.org/qty/" + token;
  linkEl.target = "_blank";
  linkEl.title = "[check source]";
  linkEl.innerText = "LOADING...";
  getLinkEl.cache[token] = linkEl;
  return linkEl;
}

function getCardEl(token) {
  if (!getCardEl.cache) getCardEl.cache = {};
  if (getCardEl.cache[token]) return getCardEl.cache[token];
  const tickerEl = document.createElement("ticker");
  tickerEl.className = "length-" + token.length;
  tickerEl.innerText = token.toUpperCase();
  const cardEl = document.createElement("card");
  cardEl.tabIndex = -1;
  cardEl.appendChild(getCanvasEl(token));
  cardEl.appendChild(tickerEl);
  cardEl.appendChild(getLinkEl(token));
  getCardEl.cache[token] = cardEl;
  return cardEl;
}

function createCard(token) {
  contentEl.appendChild(getCardEl(token));
  resetLays(token);
  fetchData(token, !dataset[token]).then(resetLays);
}

function createCards() {
  tokens[mode].forEach(createCard);
  const scroll = Number(localStorage.getItem("scroll"));
  if (scroll <= 0) return;
  const scrollLeft = (scroll * (appEl.scrollWidth - appEl.clientWidth)) / 1e8;
  appEl.scrollLeft = scrollLeft;
  setTimeout(() => (appEl.scrollLeft = scrollLeft));
}

function findIndexes(data = [], x = 0) {
  if (data.length === 0) return [0, 0];
  if (data.length === 1) return [0, 1];
  let low = 0;
  let high = data.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (data[mid][0] < x) {
      low = mid + 1;
    } else if (data[mid][0] > x) {
      high = mid - 1;
    } else {
      return [mid, mid];
    }
  }
  return [Math.max(0, low - 1), Math.min(data.length - 1, low)];
}

function findClosestIndex(data, x, leftIndex, rightIndex) {
  return leftIndex === rightIndex ||
    Math.abs(data[leftIndex][0] - x) < Math.abs(data[rightIndex][0] - x)
    ? leftIndex
    : rightIndex;
}

function xToTimestamp(data, points, x) {
  const ratio =
    (x - points[0][0]) / (points[points.length - 1][0] - points[0][0]);
  const diff = data[data.length - 1][0] - data[0][0];
  return data[0][0] + ratio * diff;
}

function findClosestPeak(data, startIndex, startTimestamp, timeRange) {
  const startTime = startTimestamp - timeRange;
  const endTime = startTimestamp + timeRange;
  let peakIndex = null;
  let peakValue = data[startIndex][1];
  for (let i = startIndex; i < data.length && data[i][0] <= endTime; i++) {
    if (
      Math.abs(data[i][1] - peakValue) > 0 &&
      (peakIndex === null ||
        Math.abs(data[i][1]) > Math.abs(data[peakIndex][1]))
    ) {
      peakIndex = i;
      peakValue = data[i][1];
    }
  }
  for (let i = startIndex; i >= 0 && data[i][0] >= startTime; i--) {
    if (
      Math.abs(data[i][1] - peakValue) > 0 &&
      (peakIndex === null ||
        Math.abs(data[i][1]) > Math.abs(data[peakIndex][1]))
    ) {
      peakIndex = i;
      peakValue = data[i][1];
    }
  }
  return peakIndex;
}

function createUpdateOverlay(
  token,
  canvasEl,
  context = canvasEl.getContext("2d", { willReadFrequently: true }),
  timeout
) {
  return (event) => {
    if (timeout) cancelAnimationFrame(timeout);
    timeout = requestAnimationFrame(() => {
      if (underlays[token]) context.putImageData(underlays[token], 0, 0);
      const cutted = cuttedset[token] || [];
      const points = pointsset[token] || [];
      if (cutted.length === 0) return;
      const { x, y } = getMousePos(canvasEl, event);
      if (cutted.length === 1 || x < 0 || y < 100 || x > 328 || y > 285) {
        return drawOverlay({
          token,
          value: cutted[cutted.length - 1][1] || 0,
          cross: points[points.length - 1],
          timestamp: cutted[cutted.length - 1][0],
        });
      }
      let value, crossX, crossY, timestamp;
      const timeRange =
        {
          week: 25 * 60 * 1000,
          month: 100 * 60 * 1000,
          year: 1200 * 60 * 1000,
        }[timeframe] || 0;
      const [leftIndex, rightIndex] = findIndexes(points, x);
      const closestIndex = findClosestIndex(points, x, leftIndex, rightIndex);
      const xTimestamp = xToTimestamp(cutted, points, x);
      const nearestIndex = findClosestPeak(
        cutted,
        closestIndex,
        xTimestamp,
        timeRange
      );
      if (nearestIndex) {
        const [peakTime, peakValue] = cutted[nearestIndex];
        const [peakX, peakY] = points[nearestIndex];
        value = peakValue;
        crossX = peakX;
        crossY = peakY;
        timestamp = peakTime;
      } else {
        const [leftTime, leftValue] = cutted[leftIndex];
        const [rightTime, rightValue] = cutted[rightIndex];
        const [leftX, leftY] = points[leftIndex];
        const [rightX, rightY] = points[rightIndex];
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

async function drawUnderlay(token) {
  const canvas = getCanvasEl(token);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const { cutted, points } = drawCard(context, {
    token,
    data: dataset[token],
    icon: getIconEl(token),
    timeframe,
    crossVisible: false,
    valueVisible: false,
  });
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

function updateLink(linkEl, timestamp) {
  const formatZero = (value) => (value < 10 ? "0" + value : value.toString());
  const time = new Date(timestamp);
  const year = time.getFullYear();
  const month = formatZero(time.getMonth() + 1);
  const date = formatZero(time.getDate());
  const hour = formatZero(time.getHours());
  const minutes = formatZero(time.getMinutes());
  linkEl.innerHTML =
    "[ <span>" +
    year +
    "." +
    month +
    "." +
    date +
    "</span> | <span>" +
    hour +
    ":" +
    minutes +
    "</span> ]";
}

function drawOverlay({
  token,
  canvas = getCanvasEl(token),
  context = canvas.getContext("2d"),
  value,
  cross = [],
  timestamp = 0,
}) {
  if (value >= 0) drawValue(context, [180, 195], { token, value });
  drawCross(context, cross);
  if (timestamp) updateLink(getLinkEl(token), timestamp);
}

function resetLays(token) {
  return drawUnderlay(token).then(drawOverlay);
}
