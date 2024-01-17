import {
  cardHeight,
  cardWidth,
  debounce,
  drawCard,
  drawCross,
  drawValue,
  getMousePos,
  separate,
} from "./core.js";

const tokens = [];
const synths = [];
const dataset = {};
const cuttedset = {};
const pointsset = {};
const underlays = {};
const canvasEls = {};
const iconEls = {};
const linkEls = {};

const hiddenTokens = [
  "ceres",
  "deo",
  "hmx",
  "busd",
  "tusd",
  "frax",
  "lusd",
  "husd",
  "caps",
];

const appEl = document.documentElement.querySelector("app");
const headerEl = appEl.querySelector("header");
const timeframeEl = headerEl.querySelector("timeframe");
const timeframeLinks = timeframeEl.querySelectorAll("a");
const overlayEl = headerEl.querySelector("overlay");
const handleEl = overlayEl.querySelector("handle");
const dropdownEl = overlayEl.querySelector("dropdown");
const dropdownLinks = dropdownEl.querySelectorAll("a");
const updateEl = dropdownEl.querySelector("update");
const tokensEl = appEl.querySelector("tokens");
const synthsEl = appEl.querySelector("synths");

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
    "1y": "1y",
  }[localStorage.getItem("timeframe")] || "1m";
timeframeEl.dataset.timeframe = timeframe;

timeframeEl.addEventListener("click", (event) => {
  event.preventDefault();
  if (!event.target.id) return;
  timeframe = event.target.id;
  timeframeEl.dataset.timeframe = timeframe;
  localStorage.setItem("timeframe", timeframe);
  tokens.forEach(resetLays);
  synths.forEach(resetLays);
});

fetchTokens().then((value) => {
  const filtered = value.filter((token) => !hiddenTokens.includes(token));
  const [xst, rest] = separate(filtered, (token) =>
    (token || "").startsWith("xst")
  );
  const difflength = xst.length - rest.length;
  tokens.push(
    ...rest,
    ...xst
      .splice(xst.length - Math.floor(difflength / 2), xst.length - 1)
      .reverse()
  );
  synths.push(...xst);
  createCards();
  checkTimestamp();
  setInterval(() => checkTimestamp(), 10000);
});

function createCard(parentEl) {
  const focus = ({ target }) => {
    setTimeout(() => target.classList.add("focused"));
  };
  const blur = ({ target }) => {
    setTimeout(() => target.classList.remove("focused"));
  };
  return (token) => {
    const canvasEl = document.createElement("canvas");
    canvasEls[token] = canvasEl;
    canvasEl.width = cardWidth;
    canvasEl.height = cardHeight;
    canvasEl.addEventListener("mousemove", createUpdateOverlay(token), false);
    canvasEl.addEventListener("mouseleave", () => resetLays(token), false);
    drawUnderlay(token);
    const linkEl = document.createElement("a");
    linkEls[token] = linkEl;
    linkEl.className = "source";
    linkEl.href = "https://mof.sora.org/qty/" + token;
    linkEl.target = "_blank";
    linkEl.title = "[check source]";
    linkEl.innerText = token.toUpperCase();
    const cardEl = document.createElement("card");
    cardEl.tabIndex = -1;
    cardEl.addEventListener("focus", focus, true);
    cardEl.addEventListener("blur", blur, true);
    cardEl.addEventListener("mouseenter", focus, true);
    cardEl.addEventListener("mouseleave", blur, true);
    cardEl.appendChild(canvasEl);
    cardEl.appendChild(linkEl);
    parentEl.appendChild(cardEl);
    const iconEl = document.createElement("img");
    iconEls[token] = iconEl;
    iconEl.src = "./images/icons/" + token + ".png";
    iconEl.addEventListener("load", () => resetLays(token));
    fetchData(token).then(resetLays);
  };
}

function createCards() {
  tokensEl.className = timeframe;
  tokens.forEach(createCard(tokensEl));
  synths.forEach(createCard(synthsEl));
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

function createUpdateOverlay(token) {
  const canvasEl = canvasEls[token];
  const context = canvasEl.getContext("2d");
  let timeout;
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
          "1w": 25 * 60 * 1000,
          "1m": 100 * 60 * 1000,
          "1y": 1200 * 60 * 1000,
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
      if (checkTimestamp.timestamp && tokens.length > 0) {
        tokens.forEach((token) => fetchData(token).then(resetLays));
      }
      checkTimestamp.timestamp = timestamp;
    });
}

function fetchData(token) {
  return fetch("./data/prepared/" + token + ".json", {
    cache: "reload",
  })
    .then((response) => response.text())
    .then(JSON.parse)
    .catch(() => [])
    .then((data) => ((dataset[token] = data), token));
}

async function resetLays(token) {
  return drawUnderlay(token).then(drawOverlay);
}

async function drawUnderlay(token) {
  if (!token) return;
  const data = dataset[token];
  const canvas = canvasEls[token];
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const icon = iconEls[token];
  const { cutted, points } = drawCard(context, {
    token,
    data,
    icon,
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

function drawLink(linkEl, timestamp) {
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
  canvas = canvasEls[token],
  context = canvas.getContext("2d"),
  value,
  cross = [],
  timestamp = 0,
}) {
  if (value >= 0) drawValue(context, [180, 195], value);
  drawCross(context, cross);
  if (timestamp) drawLink(linkEls[token], timestamp);
}
