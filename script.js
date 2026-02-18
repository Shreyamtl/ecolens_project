const wasteMap = {
  "water bottle": { type: "Plastic (PET)", weight: 25, points: 40 },
  "plastic bottle": { type: "Plastic (PET)", weight: 30, points: 45 },
  "banana": { type: "Organic Waste", weight: 80, points: 50 },
  "apple": { type: "Organic Waste", weight: 70, points: 50 },
  "newspaper": { type: "Paper Waste", weight: 40, points: 35 },
  "cardboard": { type: "Paper Waste", weight: 100, points: 60 },
  "can": { type: "Metal Waste", weight: 15, points: 30 },
  "chair": { type: "Plastic Furniture", weight: 3500, points: 120 },
  "office chair": { type: "Plastic Furniture", weight: 5000, points: 150 }
};

const BASELINE = 500;
let wasteChart = null;

/* ==============================
   USER DATA INIT
============================== */

let user = localStorage.getItem("user") || "User";
let totalWaste = parseInt(localStorage.getItem("waste")) || 0;
let impactScore = parseInt(localStorage.getItem("impact")) || BASELINE;
let streak = parseInt(localStorage.getItem("streak")) || 1;
let lastLogin = localStorage.getItem("lastLogin") || null;
let history = JSON.parse(localStorage.getItem("history")) || [];

function getWasteData(className) {
  for (let key in wasteMap) {
    if (className.toLowerCase().includes(key)) {
      return wasteMap[key];
    }
  }

  // Default fallback
  return {
    type: "Mixed Waste",
    weight: 50,
    points: 20
  };
}
/* ==============================
   LOGIN
============================== */

function login() {
  let username = document.getElementById("username").value.trim();
  if (!username) return alert("Enter your name");

  localStorage.clear();

  localStorage.setItem("user", username);
  localStorage.setItem("waste", 0);
  localStorage.setItem("impact", BASELINE);
  localStorage.setItem("streak", 1);
  localStorage.setItem("lastLogin", new Date().toDateString());
  localStorage.setItem("history", JSON.stringify([]));

  window.location = "dashboard.html";
}

/* ==============================
   DATE STREAK SYSTEM
============================== */

function checkStreak() {
  let today = new Date().toDateString();
  let lastLogin = localStorage.getItem("lastLogin");
  let streak = parseInt(localStorage.getItem("streak")) || 1;

  if (!lastLogin) {
    localStorage.setItem("lastLogin", today);
    localStorage.setItem("streak", 1);
    return;
  }

  if (today === lastLogin) {
    return; // same day → no change
  }

  let yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (lastLogin === yesterday.toDateString()) {
    streak += 1;
  } else {
    streak = 1;
  }

  localStorage.setItem("streak", streak);
  localStorage.setItem("lastLogin", today);
}

/* ==============================
   INIT
============================== */

document.addEventListener("DOMContentLoaded", () => {
  checkStreak();

  if (document.getElementById("userDisplay"))
    document.getElementById("userDisplay").innerText = user;

  updateUI(true);
  renderChart();
  renderBadges();
  renderLeaderboard();
  updateNGOImpact();
  updateProgressBar();
  showLevel();
});

/* ==============================
   LOG WASTE
============================== */

function logWaste(type) {
  let today = new Date().toDateString();
  let todayLogs = history.filter(h => h.date === today);

  if (todayLogs.length >= 3) {
    showAchievement("Daily logging limit reached ⚠");
    return;
  }

  const map = { food: 120, snack: 60, shopping: 200 };
  let value = map[type] || 50;

  totalWaste += value;
  history.push({ type, value, date: today });

  localStorage.setItem("history", JSON.stringify(history));

  updateImpact();
  showAchievement("Waste Logged Successfully 🌱");
}

/* ==============================
   IMPACT CALCULATION
============================== */

function updateImpact() {
  impactScore = Math.min(BASELINE + streak * 10 - totalWaste / 50, 1000);

  if (impactScore < 0) impactScore = 0;

  localStorage.setItem("waste", totalWaste);
  localStorage.setItem("impact", Math.floor(impactScore));

  updateUI();
  renderChart();
  renderBadges();
  renderLeaderboard();
  updateNGOImpact();
  updateProgressBar();
}
/* ==============================
   SMOOTH COUNTER
============================== */

function animateValue(id, start, end, duration = 800) {
  let el = document.getElementById(id);
  if (!el) return;

  let range = end - start;
  let startTime = null;

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    let progress = Math.min((timestamp - startTime) / duration, 1);
    el.innerText = Math.floor(progress * range + start);
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

/* ==============================
   UPDATE UI
============================== */

function updateUI(firstLoad = false) {
  animateValue("waste", firstLoad ? 0 : totalWaste - 50, totalWaste);
  animateValue("points", firstLoad ? 0 : impactScore - 50, impactScore);
  animateValue("streak", firstLoad ? 0 : streak - 1, streak);

  if (document.getElementById("co2"))
    document.getElementById("co2").innerText =
      (impactScore * 0.002).toFixed(2);
}

/* ==============================
   CHART FIXED VERSION
============================== */

function renderChart() {
  let canvas = document.getElementById("wasteChart");
  if (!canvas) return;

  if (wasteChart) wasteChart.destroy();

  wasteChart = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: ["Waste", "Eco Points"],
      datasets: [
        {
          data: [totalWaste, impactScore],
          backgroundColor: ["#ff4d4d", "#00ff9d"],
          borderWidth: 0
        }
      ]
    },
    options: {
      cutout: "70%",
      plugins: {
        legend: {
          labels: { color: "white" }
        }
      }
    }
  });
}

/* ==============================
   LEVEL SYSTEM
============================== */

function showLevel() {
  let level = "Eco Rookie 🌿";

  if (impactScore >= 400) level = "Eco Champion 🌳";
  if (impactScore >= 450) level = "Eco Warrior 🔥";
  if (impactScore >= 480) level = "Eco Legend 👑";

  if (document.getElementById("level"))
    document.getElementById("level").innerText = level;
}

/* ==============================
   BADGES
============================== */

function renderBadges() {
  let el = document.getElementById("badges");
  if (!el) return;

  let badges = [];

  if (streak >= 5) badges.push("🔥 5 Day Streak");
  if (impactScore >= 200) badges.push("🌱 Eco Beginner");
  if (impactScore >= 350) badges.push("🌳 Eco Champion");
  if (impactScore >= 450) badges.push("👑 Eco Legend");

  el.innerHTML =
    badges.length > 0
      ? badges.map(b => `<div class="badge">${b}</div>`).join("")
      : "<p>No badges yet</p>";
}

/* ==============================
   LEADERBOARD (SMART SORT)
============================== */

function renderLeaderboard() {
  let list = document.getElementById("leaderboardList");
  if (!list) return;

  const data = [
    { name: user, points: impactScore },
    { name: "Ananya", points: 420 },
    { name: "Rahul", points: 350 },
    { name: "Vikram", points: 280 }
  ];

  data.sort((a, b) => b.points - a.points);

  list.innerHTML = data
    .map(
      (p, i) => `
      <div class="leader-item">
        <span>#${i + 1} ${p.name}</span>
        <span>${p.points} pts</span>
      </div>`
    )
    .join("");
}

/* ==============================
   NGO IMPACT
============================== */

function updateNGOImpact() {
  let el = document.getElementById("ngoImpact");
  if (!el) return;

  let trees = Math.floor(impactScore / 300);
  el.innerText =
    `You helped plant ${trees} trees through NGO partnerships 🌳`;
}

/* ==============================
   PROGRESS BAR
============================== */

function updateProgressBar() {
  let fill = document.getElementById("progressFill");
  if (!fill) return;

  let progress = Math.min((impactScore / BASELINE) * 100, 100);
  fill.style.width = progress + "%";

  let text = document.getElementById("goalText");
  if (text)
    text.innerText =
      Math.floor(progress) +
      "% of your monthly eco goal achieved!";
}

/* ==============================
   ACHIEVEMENT POPUP
============================== */

function showAchievement(message) {
  let popup = document.createElement("div");
  popup.className = "achievement-popup";
  popup.innerText = message;
  document.body.appendChild(popup);

  setTimeout(() => {
    popup.remove();
  }, 2500);
}
function previewImage(event) {
  let reader = new FileReader();
  reader.onload = function(){
    let img = document.getElementById("preview");
    img.src = reader.result;
    img.style.display = "block";
  }
  reader.readAsDataURL(event.target.files[0]);
}
// function scanWaste() {
//   let fileInput = document.getElementById("wasteImage");
//   let file = fileInput.files[0];

//   if (!file) return alert("Upload an image first");

//   let fileName = file.name.toLowerCase();
//   let result = "Unknown Waste !";

//   if (fileName.includes("plastic")) result = "Plastic Waste ♻";
//   else if (fileName.includes("paper")) result = "Paper Waste 📄";
//   else if (fileName.includes("food")) result = "Food Waste 🍎";
//   else result = "Mixed Waste 🗑";

//   document.getElementById("scanResult").innerText =
//     "Detected: " + result;

//   showAchievement("AI Waste Scan Completed 🤖🌱");
// }

let model;

async function loadModel() {
  model = await mobilenet.load();
  console.log("AI Model Loaded");
}

loadModel();

async function scanWasteAI() {
  if (!model) {
    alert("Model loading...");
    return;
  }

  let img = document.getElementById("preview");

  if (!img.src) {
    alert("Upload image first");
    return;
  }

  const predictions = await model.classify(img);
  let top = predictions[0];

  let wasteData = getWasteData(top.className);

  // Update totals
  totalWaste += wasteData.weight;
  impactScore += wasteData.points;

  localStorage.setItem("waste", totalWaste);
  localStorage.setItem("impact", impactScore);

  document.getElementById("scanResult").innerHTML =
    `Detected: <b>${wasteData.type}</b><br>
     Estimated Waste: <b>${wasteData.weight}g</b><br>
     Confidence: ${Math.round(top.probability * 100)}%`;

  updateUI();
  renderChart();
  renderLeaderboard();
  showAchievement("AI Waste Logged 🌱");
}