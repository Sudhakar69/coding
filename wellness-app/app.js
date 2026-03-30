const keys = {
  workouts: "wellness_workouts",
  meals: "wellness_meals",
  notes: "wellness_notes",
};

const state = {
  workouts: load(keys.workouts),
  meals: load(keys.meals),
  notes: load(keys.notes),
};

const workoutForm = document.getElementById("workout-form");
const workoutList = document.getElementById("workout-list");
const mealForm = document.getElementById("meal-form");
const mealList = document.getElementById("meal-list");
const mindfulnessForm = document.getElementById("mindfulness-form");
const mindfulnessList = document.getElementById("mindfulness-list");

const summaryWorkouts = document.getElementById("summary-workouts");
const summaryMinutes = document.getElementById("summary-minutes");
const summaryCalories = document.getElementById("summary-calories");
const summaryMeals = document.getElementById("summary-meals");
const summaryNotes = document.getElementById("summary-notes");

const meditationMinutes = document.getElementById("meditation-minutes");
const startSessionBtn = document.getElementById("start-session");
const stopSessionBtn = document.getElementById("stop-session");
const timerStatus = document.getElementById("timer-status");

let timer = null;
let secondsRemaining = 0;

workoutForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const type = document.getElementById("workout-type").value.trim();
  const duration = Number(document.getElementById("workout-duration").value);
  const calories = Number(document.getElementById("workout-calories").value || 0);

  state.workouts.unshift({
    type,
    duration,
    calories,
    at: new Date().toISOString(),
  });

  save(keys.workouts, state.workouts);
  workoutForm.reset();
  renderAll();
});

mealForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const day = document.getElementById("meal-day").value;
  const mealType = document.getElementById("meal-type").value;
  const name = document.getElementById("meal-name").value.trim();

  state.meals.unshift({
    day,
    mealType,
    name,
    at: new Date().toISOString(),
  });

  save(keys.meals, state.meals);
  mealForm.reset();
  renderAll();
});

mindfulnessForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const note = document.getElementById("mindfulness-note").value.trim();

  state.notes.unshift({
    note,
    at: new Date().toISOString(),
  });

  save(keys.notes, state.notes);
  mindfulnessForm.reset();
  renderAll();
});

startSessionBtn.addEventListener("click", () => {
  if (timer) {
    return;
  }

  const minutes = Number(meditationMinutes.value);
  if (!minutes || minutes < 1) {
    timerStatus.textContent = "Enter a valid number of minutes.";
    return;
  }

  secondsRemaining = minutes * 60;
  updateTimerStatus();

  timer = setInterval(() => {
    secondsRemaining -= 1;
    if (secondsRemaining <= 0) {
      clearInterval(timer);
      timer = null;
      timerStatus.textContent = "Session complete. Great job staying present!";
      return;
    }
    updateTimerStatus();
  }, 1000);
});

stopSessionBtn.addEventListener("click", () => {
  if (!timer) {
    return;
  }
  clearInterval(timer);
  timer = null;
  timerStatus.textContent = "Session stopped.";
});

function updateTimerStatus() {
  const minutes = Math.floor(secondsRemaining / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (secondsRemaining % 60).toString().padStart(2, "0");
  timerStatus.textContent = `Meditation in progress: ${minutes}:${seconds}`;
}

function renderAll() {
  workoutList.innerHTML = state.workouts
    .map(
      (item) =>
        `<li><strong>${escapeHtml(item.type)}</strong> — ${item.duration} min, ${item.calories} cal</li>`
    )
    .join("");

  mealList.innerHTML = state.meals
    .map(
      (item) =>
        `<li><strong>${escapeHtml(item.day)} ${escapeHtml(item.mealType)}</strong> — ${escapeHtml(item.name)}</li>`
    )
    .join("");

  mindfulnessList.innerHTML = state.notes
    .map((item) => `<li>${escapeHtml(item.note)}</li>`)
    .join("");

  summaryWorkouts.textContent = state.workouts.length;
  summaryMinutes.textContent = state.workouts.reduce((acc, item) => acc + item.duration, 0);
  summaryCalories.textContent = state.workouts.reduce((acc, item) => acc + item.calories, 0);
  summaryMeals.textContent = state.meals.length;
  summaryNotes.textContent = state.notes.length;
}

function load(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

renderAll();
