# coding

## Holistic Wellness Hub (Fitness + Workout + Meal Planning + Meditation)

A simple web app that combines:
- Fitness tracking + workout logging
- Meal planning
- Meditation timer
- Mindfulness journaling

### Run locally

```bash
cd wellness-app
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser.

## MPIN Login App (Node.js + MongoDB)

A responsive login/register page inspired by the provided design, backed by Node.js, Express, and MongoDB.

### Run locally

```bash
cd login-app
cp .env.example .env
npm install
npm start
```

Open `http://localhost:3000`.

> Ensure MongoDB is running and `MONGO_URI` in `.env` points to your database.
