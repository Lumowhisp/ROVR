# ⚡ ROVR — Next-Generation Fitness Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Expo](https://img.shields.io/badge/Expo-SDK_56-blue.svg)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.85.3-61DAFB.svg)](https://reactnative.dev)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933.svg)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express.js-5.x-000000.svg)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248.svg)](https://www.mongodb.com)

**ROVR** is a premium, modern fitness and wellness tracking platform designed to help users transform their physical health, track daily hydration, monitor BMI, and stay consistent on their fitness journey.

Built with a state-of-the-art **Expo SDK 56 React Native** mobile client and a high-performance **Express.js + MongoDB** backend API.

---

## 🌟 Key Features

- 🎨 **Premium Aesthetic Design**: Dark mode interface (`#0A0A0F`), gradient accents (Electric Blue → Violet), glassmorphism inputs, and ambient background glow orbs.
- 🔐 **Secure JWT Authentication**: Full Sign In & Sign Up flow with encrypted password hashing (`bcryptjs`), JWT token storage (`AsyncStorage`), and automatic session restoration.
- 📱 **Mobile Hotspot & Wi-Fi Ready**: Auto-detects local host IP address via `expo-constants` so Expo Go mobile clients connect seamlessly on any local Wi-Fi or mobile hotspot.
- 🏃 **Fitness & Hydration Tracking**: Built-in data schemas and API endpoints for user onboarding, BMI calculation, and daily hydration logging.
- 🚀 **Smooth 60 FPS Animations**: Staggered form field entrances, pulsing brand glow, press physics, and error shake effects powered by `react-native-reanimated`.

---

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph Mobile Client [Expo SDK 56 App]
        UI[Sign In / Sign Up Screens] --> AuthCtx[AuthContext / AsyncStorage]
        AuthCtx --> API[Axios API Client]
        API -->|Dynamic IP Resolution| Net[Expo Constants Host Detector]
    end

    subgraph Backend API [Express 5.x Service]
        Net -->|HTTP / JSON| ExpressApp[Express App]
        ExpressApp --> AuthRouter[/api/auth Router]
        ExpressApp --> ProfileRouter[/api/services/profile Router]
        ExpressApp --> OnboardRouter[/api/onboard Router]
        
        AuthRouter --> AuthCtrl[Auth Controller]
        AuthCtrl --> JWT[JSON Web Token]
        AuthCtrl --> Bcrypt[bcryptjs Hash]
        AuthCtrl --> Mongoose[User Mongoose Model]
    end

    subgraph Database [Database Layer]
        Mongoose --> Atlas[(MongoDB Atlas / Local DB)]
    end
```

---

## 📁 Repository Directory Structure

```
ROVR/
├── README.md                  # Comprehensive platform documentation
├── LICENSE                    # MIT Open Source License
├── CONTRIBUTING.md             # Developer contribution guidelines
├── backend/                   # Node.js + Express + MongoDB REST API
│   ├── README.md              # Backend-specific documentation & API spec
│   ├── server.js              # Server entry point (port 3000)
│   ├── package.json           # Backend dependencies & scripts
│   ├── .env                   # Environment variables (Mongo URI, JWT secret)
│   └── src/
│       ├── app.js             # Express application setup & route mounting
│       ├── config/            # Database connection & env verification
│       ├── controller/        # Request handlers (signup, signin, profile)
│       ├── Middleware/        # JWT route protection middleware
│       ├── models/            # Mongoose schemas (User, DailyHydration)
│       ├── routes/            # Express route endpoints
│       └── services/          # Business logic services
└── frontend/                  # Expo SDK 56 React Native Mobile App
    ├── README.md              # Frontend-specific architecture & UI documentation
    ├── app.json               # Expo configuration & app metadata
    ├── package.json           # Frontend dependencies & Expo scripts
    ├── tsconfig.json          # TypeScript compiler configuration & path aliases
    └── src/
        ├── app/               # Expo Router file-based navigation routes
        │   ├── _layout.tsx    # Root layout with AuthProvider & nav guard
        │   ├── index.tsx      # Root route redirect
        │   ├── (auth)/        # Unauthenticated stack (sign-in, sign-up)
        │   └── (tabs)/        # Authenticated tab navigation group
        ├── components/        # Reusable UI components & animations
        ├── constants/         # Color palettes, themes, and spacing
        ├── context/           # React Context state management (AuthContext)
        ├── hooks/             # Custom hooks (color scheme, theme)
        ├── services/          # Axios API service with dynamic host IP detection
        └── types/             # TypeScript declaration files
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher
- **Expo Go**: Installed on iOS (App Store) or Android (Play Store)

### 2. Environment Setup

#### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `backend/.env`:
   ```env
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/rovr
   JWT_SECRET=rovr_super_secret_jwt_key
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The backend will run at `http://localhost:3000` (and on your local network IP).*

#### Frontend Setup
1. Open a new terminal tab and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Expo development server:
   ```bash
   npx expo start --clear
   ```

---

## 📲 Testing on Mobile Device (Wi-Fi or Mobile Hotspot)

ROVR features **automatic host IP resolution**. You do **not** need to manually hardcode your IP address when connecting via Wi-Fi or Mobile Hotspot!

1. Connect your **laptop** and **mobile phone** to the same Wi-Fi network or Mobile Hotspot.
2. Run `npx expo start --clear` in `frontend/`.
3. Open **Expo Go** on your phone and scan the displayed QR code.
4. The mobile app automatically detects your laptop's IP address (e.g. `http://10.57.101.37:3000`) and connects to your backend API seamlessly.

---

## 🛠️ Tech Stack & Libraries

### Mobile Client (Frontend)
- **Framework**: [Expo SDK 56](https://expo.dev) with [Expo Router 56](https://docs.expo.dev/router/introduction/)
- **UI Library**: [React Native 0.85.3](https://reactnative.dev)
- **State & Storage**: React Context + [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Animations**: [React Native Reanimated 4](https://docs.swmansion.com/react-native-reanimated/)
- **Visuals & Gradients**: [expo-linear-gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/) & [expo-image](https://docs.expo.dev/versions/latest/sdk/image/)

### Backend REST API
- **Runtime**: [Node.js](https://nodejs.org/) (ES Modules)
- **Framework**: [Express.js 5.x](https://expressjs.com/)
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose 9.x](https://mongoosejs.com/)
- **Authentication**: [JSON Web Tokens (JWT)](https://jwt.io/) & [bcryptjs](https://www.npmjs.com/package/bcryptjs)
- **Logger**: [Morgan](https://www.npmjs.com/package/morgan)

---

## 📑 License & Contributing

- Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for full details.
- Want to contribute? Check out [`CONTRIBUTING.md`](./CONTRIBUTING.md).
