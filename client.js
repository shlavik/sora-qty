import { drawCard } from "./utils.js";

const updateRem = () => {
  document.documentElement.style.setProperty(
    "font-size",
    window.innerHeight * 0.01 + "px"
  );
};

updateRem();

window.addEventListener("resize", updateRem);

window.addEventListener("wheel", ({ deltaX, deltaY }) => {
  document.documentElement.scrollLeft += deltaX + deltaY;
});

const timeframeEl = document.querySelector("a#timeframe");
const h2El = document.querySelector("h2");
const contentEl = document.querySelector("content");

let timeframe =
  localStorage.getItem("timeframe") === "monthly" ? "monthly" : "weekly";

timeframeEl.innerText = timeframe;

timeframeEl.addEventListener("click", (event) => {
  event.preventDefault();
  timeframe = timeframe === "weekly" ? "monthly" : "weekly";
  localStorage.setItem("timeframe", timeframe);
  timeframeEl.innerText = timeframe;
  tokens.forEach((token) => updateCard({ token }));
});

const tokens = [];
const dataset = {};
const canvases = {};
const icons = {};

fetchTokens().then((value) => {
  tokens.push(...value);
  checkTimestamp();
  setInterval(() => checkTimestamp(), 10000);
  createCards();
});

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
          fetchData(token).then(updateCard);
        });
      }
      checkTimestamp.timestamp = timestamp;
    });
}

function createCards() {
  tokens.forEach((token) => {
    const canvas = document.createElement("canvas");
    canvases[token] = canvas;
    canvas.width = 360;
    canvas.height = 630;
    const link = document.createElement("a");
    link.href = "https://mof.sora.org/qty/" + token;
    link.appendChild(canvas);
    contentEl.appendChild(link);
    const icon = document.createElement("img");
    icons[token] = icon;
    icon.src = "./images/icons/" + token + ".png";
    icon.addEventListener("load", () => {
      fetchData(token).then(updateCard);
    });
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

function updateCard({ token, data = dataset[token] } = {}) {
  const canvas = canvases[token];
  const icon = icons[token];
  const { qty, min, max } = drawCard(
    canvas.getContext("2d"),
    [
      [0, 0],
      [canvas.width, canvas.height],
    ],
    { token, data, icon, timeframe }
  );
  canvas.title =
    "[view source]\n\n" +
    token.toUpperCase() +
    "\nqty: " +
    qty +
    "\nmax: " +
    max +
    "\nmin: " +
    min;
}
