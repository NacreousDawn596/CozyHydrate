# 🌿 CozyHydrate Reminder

A cozy, intelligent hydration app that **actually adapts to you** — not some random “drink water now” spammer.

CozyHydrate uses a **built-in neural network (logistic regression)** to learn your habits and personalize your daily water goals and reminders over time.

---

## ✨ What Makes It Different?

This is **not** a dumb counter app.

CozyHydrate evolves with each user.

### 🧠 Adaptive Intelligence (Neural Network)

* Built-in **logistic regression model**
* Learns from:

  * Height & weight
  * Past hydration logs
  * Local temperature & humidity
  * Drinking frequency & timing
* Each user gets a **unique daily hydration goal**
* Goals can also be **manually overridden**

No two users have the same experience.

---

## 💧 Core Features

### 🚰 Hydration Tracking

* Log water intake effortlessly
* Manual history entry supported
* Visual daily progress indicator

### 🔔 Smart Reminders

* Neural-network-driven reminders
* Adapts reminder timing based on your behavior
* Fewer useless notifications, more well-timed nudges

### 📊 Analytics & History

* Interactive hydration chart
* Track consumption over:

  * 7 days
  * 10 days
  * 15 days
  * 30 days
* Chart range updates dynamically when clicked

### 🎨 Built-in Themes

* Multiple cozy themes included
* No external setup needed
* Clean, calm, eye-friendly UI

### ⚖️ Dehydration Scale

* Visual indicator of current hydration state
* Easy to understand at a glance

---

## 🛠 Tech Stack

* **React Native**
* **Expo**
* **Expo Router**
* **TypeScript**
* **React Query**
* **Lucide React Native**
* **Custom Logistic Regression (Neural Network)**

---

## 🚀 Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/)
* [Bun](https://bun.sh/)

---

### Installation

```bash
git clone https://github.com/NacreousDawn596/CozyHydrate.git
cd CozyHydrate
bun install
```

---

### Running the App

```bash
# Start development server
bun start

# Android
bun run android

# iOS
bun run ios

# Web
bun run web
```

---

## 📁 Project Structure

```
├── app/                    # App screens (Expo Router)
│   ├── (tabs)/             # Tab navigation
│   │   ├── _layout.tsx     # Tabs layout
│   │   └── index.tsx       # Home screen
│   ├── _layout.tsx         # Root layout
│   └── +not-found.tsx      # 404 screen
├── assets/                 # Static assets
│   └── images/             # Icons & images
├── components/             # Reusable UI components
├── constants/              # App constants & configs
├── context/                # React contexts
├── electron/                # Electron App
├── types/                  # TypeScript types
├── utils/                  # Utilities & neural network logic
├── app.json                # Expo config
├── package.json            # Scripts & dependencies
└── tsconfig.json           # TypeScript config
```

---

## 🧑‍💻 Author

**NacreousDawn596**

---

## 🧠 Philosophy

> Drink water — but make it **personal**, **intelligent**, and **calm**.

CozyHydrate isn’t here to nag you.
It learns you, adapts, and reminds you *only when it makes sense*.

---