# ROVR — Next-Generation Fitness & Health Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Expo](https://img.shields.io/badge/Expo-SDK_56-blue.svg)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-0.85.3-61DAFB.svg)](https://reactnative.dev)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-339933.svg)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express.js-5.x-000000.svg)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248.svg)](https://www.mongodb.com)

ROVR is an integrated fitness, wellness, and activity-tracking platform engineered to deliver personalized health insights, biological cycle-aware training recommendations, predictive hydration modeling, and gamified consistency tracking.

Built as a decoupled full-stack architecture featuring an **Expo SDK 56 React Native** mobile client and an **Express.js + MongoDB** REST API service.

---

## Team and Role Assignments

| Member Name | Primary Role | Core Responsibility and Focus Area |
|---|---|---|
| **Aditya** (`@Lumowhisp`) | **Lead Architect and Full-Stack Engineer** | Project Lead, System Architecture, Mobile Client and Auth Integration |
| *[ Team Member 1 ]* | **Backend and Database Engineer** | Mongoose Schemas, Express Controllers, Cycle Prediction Engine |
| *[ Team Member 2 ]* | **Frontend and Mobile UI Engineer** | React Native UI Components, Cycle Calendar, Symptom Tracker |
| *[ Team Member 3 ]* | **Gamification Specialist** | XP Calculation Engine, Hydration and Nutrition Triggers, Streak Logic |
| *[ Team Member 4 ]* | **Security and Privacy Lead** | Health Data Encryption, GDPR Compliance, Consent Protocols |

---

## Core Capabilities

- **Intelligent Activity and Route Safety**: Live GPS activity recording with route visualization, surface analytics, and AI-assisted safety evaluations.
- **Cycle-Aware Biological Guidance**: Women's Wellness companion that automatically aligns workout intensity, recovery regimens, and nutritional suggestions with hormonal phases.
- **Behavioral Hydration Engine**: Context-aware fluid tracking that replaces static alarms with adaptive reminders derived from baseline habits and live workout intensity.
- **Cross-Health Intelligence**: Ingests physiological metrics (sleep duration, resting heart rate, step count) via Health Connect to adjust daily training load.
- **Gamified Consistency Loop**: Progression system featuring XP rewards, multi-week streaks, landmark quests, and exploration bonuses.
- **Secure Token-Based Authentication**: JWT session handling with bcrypt password hashing, encrypted local storage, and optional Firebase OAuth integration.
- **Dynamic Host Resolution**: Automatic network IP discovery via `expo-constants` for zero-configuration testing across local Wi-Fi and mobile hotspots.

---

## System Architecture

```mermaid
graph TD
    subgraph Mobile Client [Expo SDK 56 Mobile App]
        UI[User Interface Screens] --> AuthCtx[AuthContext / AsyncStorage]
        AuthCtx --> API[Axios HTTP Client]
        API -->|Dynamic Host Resolution| Net[Expo Constants Network Layer]
    end

    subgraph Backend Service [Express 5.x REST API]
        Net -->|HTTP / JSON Requests| ExpressApp[Express Application]
        ExpressApp --> AuthRouter[/api/auth Routes]
        ExpressApp --> ProfileRouter[/api/services/profile Routes]
        ExpressApp --> OnboardRouter[/api/onboard Routes]
        ExpressApp --> HydrationRouter[/api/hydration Routes]
        
        AuthRouter --> AuthCtrl[Authentication Controller]
        AuthCtrl --> JWT[JWT Token Generation]
        AuthCtrl --> Bcrypt[bcryptjs Hashing]
        AuthCtrl --> Mongoose[Mongoose Schemas]
    end

    subgraph Database Layer [Persistence Tier]
        Mongoose --> Atlas[(MongoDB Atlas Cluster)]
    end
```

---

## Repository Structure

```text
ROVR/
├── README.md                  # Root project documentation
├── LICENSE                    # MIT Open Source License
├── CODE_OF_CONDUCT.md         # Community code of conduct
├── CONTRIBUTING.md             # Developer contribution guidelines
├── Docs/                      # Technical specifications and presentation materials
│   ├── PPT/                   # Presentation outlines and decks
│   ├── hydration.md           # Hydration engine specification
│   └── README.md              # Extended system design documentation
├── backend/                   # Node.js + Express.js REST API
│   ├── server.js              # Server entry point
│   ├── package.json           # Backend dependencies and scripts
│   ├── .env                   # Environment variables (Mongo URI, JWT Secret)
│   └── src/
│       ├── app.js             # Express application and route mounting
│       ├── config/            # Database connectivity and configuration
│       ├── controller/        # Request handlers
│       ├── Middleware/        # Route authentication middleware
│       ├── models/            # Mongoose schemas (User, DailyHydration, Cycle)
│       ├── routes/            # Route endpoints
│       └── services/          # Business logic and calculation engines
└── frontend/                  # Expo SDK 56 React Native Mobile Client
    ├── app.json               # Expo application configuration
    ├── package.json           # Frontend dependencies and scripts
    ├── tsconfig.json          # TypeScript compiler configuration
    └── src/
        ├── app/               # Expo Router file-based routes
        │   ├── _layout.tsx    # Root layout and navigation providers
        │   ├── index.tsx      # Entry redirect handler
        │   ├── (auth)/        # Authentication routes (Sign In, Sign Up)
        │   ├── (onboarding)/  # Profile initialization routes
        │   └── (tabs)/        # Authenticated application tabs
        ├── components/        # Reusable UI elements and animated widgets
        ├── constants/         # Color palettes, typography, and layout tokens
        ├── context/           # React Context providers (AuthContext)
        ├── hooks/             # Custom utility hooks
        ├── services/          # API services with dynamic host detection
        └── types/             # TypeScript declaration files
```

---

## Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **Expo Go**: Installed on an iOS or Android device for physical hardware testing
- **MongoDB**: Active MongoDB Atlas cluster URI or local MongoDB instance

---

### Installation and Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/Lumowhisp/ROVR.git
cd ROVR
```

#### 2. Backend Configuration
```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:
```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/rovr
JWT_SECRET=your_jwt_secret_key
```

Start the backend development server:
```bash
npm run dev
```
The server will initialize on port `3000`.

#### 3. Frontend Configuration
Open a separate terminal window:
```bash
cd frontend
npm install
npx expo start --clear
```

---

## Physical Device Testing (Local Network / Hotspot)

ROVR includes automatic host IP resolution. Manual configuration of IP addresses is not required when testing on local networks:

1. Ensure the development computer and mobile device are connected to the same Wi-Fi network or mobile hotspot.
2. Start the Expo server using `npx expo start --clear`.
3. Scan the generated QR code using **Expo Go** (Android) or the **Camera app** (iOS).
4. The mobile application detects the host machine's IP address dynamically and communicates with the backend API.

---

## Technology Stack

### Mobile Client
- **Framework**: Expo SDK 56, Expo Router 56
- **Core Library**: React Native 0.85.3, React 19
- **State Management**: React Context, `@react-native-async-storage/async-storage`
- **Networking**: Axios
- **Animations**: React Native Reanimated 4
- **Styling and Layout**: Expo Linear Gradient, React Native SVG, Expo Blur

### Backend Service
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js 5.x
- **Database**: MongoDB Atlas via Mongoose 9.x
- **Authentication**: JSON Web Tokens (JWT), bcryptjs
- **Logging**: Morgan

---

## Verification and Quality Assurance

Execute the following commands to validate code formatting, types, and dependencies:

```bash
# Frontend Type Checking
cd frontend
npm run typecheck

# Frontend Linting
npm run lint

# Backend Verification
cd backend
node server.js
```

---

## License

Distributed under the MIT License. See [`LICENSE`](./LICENSE) for full terms.
