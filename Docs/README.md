# ⚡ ROVR — Move. Train. Evolve.

> **ROVR is a modern fitness, wellness, activity-tracking and gamification platform designed to make healthy movement consistent, measurable and fun.**

ROVR combines **fitness tracking, running/cycling route maps, wellness data, hydration, BMI, challenges, XP, streaks, landmarks and social/team-oriented experiences** into one mobile application.

The project is built as a full-stack application with an **Expo React Native frontend** and a **Node.js + Express + MongoDB backend**.

---

## 🎯 Vision

ROVR is not intended to be just another fitness tracker.

The goal is to turn everyday physical activity into a **game-like progression system** where users can:

- Track workouts and outdoor activities
- Visualize running and cycling routes on maps
- Monitor wellness metrics
- Track hydration and nutrition-related tasks
- Build daily/weekly streaks
- Earn XP and progress through the ROVR ecosystem
- Complete challenges
- Discover and interact with landmarks
- Compete through weekly challenges
- Build consistency rather than relying only on motivation

### Core philosophy

**Move → Track → Earn → Compete → Evolve**

---

# ✨ Core Features

## 🏃 Activity Tracking

ROVR supports activity tracking with a focus on outdoor movement.

### Running & Cycling

- Live activity tracking
- Route visualization using map polylines
- Distance tracking
- Duration tracking
- Pace/speed information
- Activity history
- GPS-based route recording
- Future support for richer activity analytics

The route is represented as a **polyline on the map**, allowing users to see exactly where they ran or cycled.

---

## 🗺️ Gamified Area Tracking

One of ROVR's core gamification concepts is **area exploration**.

Instead of only tracking distance, ROVR can turn the map into a progression system.

### Concept

As users move through an area:

- Their travelled regions can become part of their activity footprint
- Exploration can contribute toward XP/progression
- Users can discover new areas
- Repeated activity can encourage users to explore beyond their usual routes

This makes the physical world part of the ROVR game.

### Long-term direction

Possible mechanics include:

- Area completion percentage
- Territory/exploration XP
- Local exploration streaks
- New-area bonuses
- City/region exploration levels
- Leaderboards based on exploration

---

# 🏛️ Landmark Weekly Challenge

ROVR also introduces **landmark-based challenges**.

Every week, users can receive a landmark-related objective.

Examples:

- Run/cycle to a selected landmark
- Visit a landmark
- Complete a minimum distance around a landmark
- Discover a new landmark
- Complete a landmark route
- Earn bonus XP for reaching the weekly target

### Example

> 🏛️ **Weekly Landmark Challenge**  
> Visit India Gate and complete 3 km around the area.  
> **Reward:** +500 XP

The system can eventually support dynamically generated landmark challenges based on:

- User location
- Nearby landmarks
- Distance
- Difficulty
- Previous activity
- Weekly progression

---

# 🎮 Gamification System

ROVR uses gamification to encourage consistency.

## XP

Users can earn XP through actions such as:

- Completing workouts
- Running
- Cycling
- Completing hydration goals
- Completing wellness tasks
- Maintaining streaks
- Completing weekly challenges
- Exploring new areas
- Completing landmark challenges

### Example

| Action | Example XP |
|---|---:|
| Daily activity | +50 XP |
| Complete hydration goal | +30 XP |
| Run 5 km | +100 XP |
| Weekly challenge | +300 XP |
| Landmark challenge | +500 XP |
| New-area exploration | +50 XP |
| Streak milestone | Bonus XP |

> XP values are configurable and can evolve with the backend reward system.

---

## 🔥 Streaks

Consistency is one of the main goals of ROVR.

Possible streak mechanics:

- Daily activity streak
- Workout streak
- Hydration streak
- Weekly challenge streak
- Exploration streak

Streak milestones can unlock:

- XP bonuses
- Badges
- Levels
- Special challenges
- Achievement rewards

---

# 💧 Hydration Tracking

ROVR includes daily hydration tracking.

Users can:

- Log water intake
- Track daily hydration progress
- Set/receive hydration goals
- Complete hydration tasks
- Earn XP through consistency

Hydration data can be connected with the gamification engine.

---

# 🥗 Wellness & Nutrition Tasks

ROVR is intended to cover more than workouts.

The wellness layer can include:

- Nutrition-related tasks
- Hydration
- Daily wellness tasks
- Recovery-oriented tasks
- Habit tracking

These tasks can contribute toward the user's overall ROVR progression.

---

# ⚖️ BMI & Body Metrics

The onboarding flow collects important user information for personalized fitness experiences.

Current onboarding/data concepts include:

- Birthday
- Height
- Weight
- Gender
- BMI

### BMI calculation

```text
BMI = weight / (height in meters)²
```

Example backend logic:

```text
BMI = weight / ((height / 100)²)
```

The BMI value can be stored with the user profile and used for future personalization.

---

# 🔐 Authentication

ROVR uses token-based authentication.

Current architecture includes:

- Sign up
- Sign in
- JWT authentication
- Password hashing with `bcryptjs`
- Authenticated API requests
- Session persistence
- AsyncStorage-based token/session handling
- Protected backend routes

The frontend uses an authentication context to manage the user's session.

---

# 📱 Frontend

The mobile application is built with:

- **Expo**
- **React Native**
- **Expo Router**
- **TypeScript**
- **React Native Reanimated**
- **Axios**
- **AsyncStorage**
- **React Native SVG**
- **Expo Linear Gradient**
- **Expo Image**

### Frontend responsibilities

The frontend handles:

- Authentication UI
- Onboarding
- Profile/wellness screens
- Activity tracking UI
- Maps
- Workout screens
- Gamification UI
- XP/progression
- Challenges
- Animations
- Navigation
- API communication

---

# ⚙️ Backend

The backend is built using:

- **Node.js**
- **Express.js**
- **MongoDB**
- **Mongoose**
- **JWT**
- **bcryptjs**
- **Morgan**

### Backend responsibilities

The backend handles:

- Authentication
- User profiles
- Onboarding
- BMI calculations
- Activity data
- Hydration data
- Wellness data
- XP/rewards
- Challenges
- Future leaderboard systems
- Persistent application data

---

# 🏗️ High-Level Architecture

```text
                         ┌─────────────────────┐
                         │      ROVR App       │
                         │ Expo + React Native │
                         └──────────┬──────────┘
                                    │
                                  Axios
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │    Express API      │
                         │      Node.js        │
                         └──────────┬──────────┘
                                    │
             ┌──────────────────────┼──────────────────────┐
             │                      │                      │
             ▼                      ▼                      ▼
      Authentication           User/Wellness          Activity System
             │                      │                      │
             └──────────────────────┼──────────────────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │      MongoDB        │
                         │     + Mongoose      │
                         └─────────────────────┘
```

---

# 📂 Repository Structure

```text
ROVR/
│
├── README.md
├── CONTRIBUTING.md
├── LICENSE
├── task.md
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── Design/
│   └── # UI/UX and design resources
│
├── Docs/
│   └── # Project documentation
│
├── frontend/
│   ├── assets/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   ├── (onboarding)/
│   │   │   └── (tabs)/
│   │   │
│   │   ├── components/
│   │   ├── constants/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   │
│   ├── app.json
│   ├── package.json
│   └── tsconfig.json
│
└── backend/
    ├── src/
    │   ├── config/
    │   ├── controller/
    │   ├── Middleware/
    │   ├── models/
    │   ├── routes/
    │   └── services/
    │
    ├── server.js
    ├── package.json
    └── .env
```

---

# 🧭 Application Flow

## 1. Authentication

```text
Launch
  ↓
Check Session
  ↓
Authenticated?
 ┌───────────────┐
 │               │
Yes              No
 │               │
 ▼               ▼
App            Auth
                │
          ┌─────┴─────┐
          ▼           ▼
        Sign In     Sign Up
          │           │
          └─────┬─────┘
                ▼
           Onboarding
```

---

## 2. Onboarding

The onboarding experience is designed as a multi-step flow.

Current/implemented concepts include:

```text
Birthday
   ↓
Height
   ↓
Weight
   ↓
Gender
   ↓
BMI Calculation
   ↓
Profile Setup
   ↓
Main Application
```

The onboarding UI uses animated and reusable React Native components.

---

# 🗺️ Activity Flow

```text
Start Activity
      ↓
GPS Tracking
      ↓
Collect Coordinates
      ↓
Calculate Distance
      ↓
Draw Polyline
      ↓
Activity Complete
      ↓
Save Activity
      ↓
Calculate Rewards
      ↓
XP / Streak / Challenge Progress
```

---

# 🧩 Gamification Architecture

A long-term gamification architecture can be represented as:

```text
                 User Activity
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
       Running     Cycling     Wellness
          │           │           │
          └───────────┼───────────┘
                      ▼
                Activity Engine
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
         XP         Streak      Challenge
          │           │           │
          └───────────┼───────────┘
                      ▼
                 Progression
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
        Levels      Badges      Leaderboard
```

---

# 🏆 Challenge System

ROVR challenges can exist at multiple levels.

### Daily

Small actions designed to maintain consistency.

Examples:

- Drink your daily water target
- Walk 3 km
- Complete one workout

### Weekly

Larger objectives.

Examples:

- Run 20 km this week
- Complete 3 workouts
- Visit a landmark
- Explore a new area

### Long-term

Progression-based objectives.

Examples:

- Reach Level 10
- Complete 100 km
- Maintain a 30-day streak
- Visit 10 landmarks

---

# 🌍 ROVR World / Exploration

The long-term vision is to make ROVR feel like a **fitness game layered over the real world**.

The map can eventually become a progression surface containing:

- User routes
- Explored areas
- Landmarks
- Challenges
- Activity zones
- Achievement locations
- Competitive areas

This creates a system where simply going outside and moving contributes to progression.

---

# 🎨 Design Direction

ROVR aims for a:

- Modern
- Premium
- Minimal
- Energetic
- Gamified
- Mobile-first

visual identity.

The UI should prioritize:

- Clear hierarchy
- Smooth animations
- Large touch targets
- Minimal clutter
- Strong typography
- Consistent spacing
- Meaningful motion
- Fast interactions

Animations are powered primarily through **React Native Reanimated**.

---

# 🧪 Development Environment

## Prerequisites

Install:

- Node.js 18+
- npm
- Git
- Expo CLI / Expo tooling
- Expo Go for physical-device testing
- MongoDB / MongoDB Atlas

---

# 🚀 Getting Started

## Clone the repository

```bash
git clone https://github.com/Lumowhisp/ROVR.git
cd ROVR
```

---

## Backend

```bash
cd backend
npm install
npm run dev
```

Backend development server:

```text
http://localhost:3000
```

Create a `.env` file:

```env
MONGO_URI=<your-mongodb-uri>
JWT_SECRET=<your-jwt-secret>
```

Never commit secrets to Git.

---

## Frontend

Open another terminal:

```bash
cd frontend
npm install
npx expo start --clear
```

Then scan the Expo QR code using Expo Go.

---

# 📡 Physical Device Development

For testing on a physical device:

1. Connect the phone and development machine to the same network.
2. Start Expo.
3. Open the project through Expo Go.
4. Make sure the backend is reachable from the phone.
5. Use the configured development API URL / host detection.

When using a local backend, `localhost` from the phone refers to the phone itself, not the development machine.

---

# 🔑 Environment Variables

Never commit production credentials.

Example frontend environment:

```env
EXPO_PUBLIC_SUPABASE_URL=<supabase-url>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
```

Example backend environment:

```env
MONGO_URI=<mongodb-uri>
JWT_SECRET=<jwt-secret>
```

Use `.env.example` files for documentation whenever possible.

---

# 🔄 Git & Contribution Workflow

ROVR follows a feature-branch workflow.

### Create a branch

```bash
git checkout -b feature/<feature-name>
```

### Example

```bash
git checkout -b feature/onboarding-weight
```

### Check changes

```bash
git status
```

### Run lint

```bash
npm run lint
```

### Commit

```bash
git add .
git commit -m "feat: add weight onboarding"
```

### Push

```bash
git push origin feature/<feature-name>
```

Then create a Pull Request.

---

# 🔀 Pull Request Guidelines

Every PR should ideally contain:

- Clear title
- Short description
- What changed
- Why it changed
- Screenshots/videos for UI changes
- Testing performed
- Related issue number
- Any known limitations

### Recommended PR structure

```text
## What
Briefly describe the change.

## Why
Explain the purpose.

## Changes
- Change 1
- Change 2
- Change 3

## Testing
- npm run lint
- Tested on Expo Go
- Tested API endpoint

## Screenshots
Add screenshots for UI changes.
```

---

# 🧹 Code Quality

Before opening a PR:

```bash
npm run lint
```

Developers should also verify:

- No unused imports
- No unnecessary console logs
- No hardcoded secrets
- Components remain reusable
- API calls are handled safely
- Loading/error states exist
- UI works on different screen sizes
- Animations do not cause unnecessary re-renders

---

# 🔒 Security

Never commit:

```text
.env
.env.local
API keys
JWT secrets
Database credentials
Supabase service-role keys
Private tokens
```

Authentication and authorization must always be enforced server-side.

---

# 🧱 Current Development Areas

ROVR development is organized around several major workstreams.

### Frontend

- Authentication
- Onboarding
- Profile
- Wellness UI
- Activity tracking
- Map/polyline tracking
- Gamification
- Challenges
- Animations
- Localization

### Backend

- Authentication
- User profiles
- Onboarding API
- BMI
- Activity APIs
- Hydration
- Wellness tasks
- XP engine
- Challenge engine
- Landmark system

### Product

- Gamification design
- Weekly challenges
- Area tracking
- Landmark exploration
- Progression system
- Social/competitive features

### Documentation

- API documentation
- Architecture documentation
- Developer setup
- Feature specifications
- Localization documentation
- Contribution guidelines

---

# 🌐 Localization

ROVR is intended to support multiple languages.

The localization system should eventually cover:

- UI labels
- Buttons
- Error messages
- Onboarding
- Challenges
- Notifications
- Accessibility text
- Help/documentation content

Translations should be maintained systematically rather than hardcoded across individual screens.

---

# 🧪 Testing Strategy

Testing should cover:

### Frontend

- Screen rendering
- Navigation
- Form validation
- Authentication state
- Onboarding flow
- Animations
- Map tracking
- Challenge progress

### Backend

- Authentication endpoints
- Protected routes
- User creation
- Onboarding
- BMI calculation
- Activity persistence
- XP calculation
- Challenge completion

### Integration

```text
Mobile App
    ↓
API
    ↓
Database
```

The complete flow should be tested before major releases.

---

# 📈 Future Roadmap

## Phase 1 — Foundation

- Authentication
- User onboarding
- Profile
- BMI
- Hydration
- Basic wellness tracking

## Phase 2 — Activity

- Running
- Cycling
- GPS tracking
- Polyline maps
- Activity history
- Distance/pace analytics

## Phase 3 — Gamification

- XP
- Levels
- Streaks
- Achievements
- Badges
- Rewards

## Phase 4 — Exploration

- Gamified area tracking
- Landmark discovery
- Landmark weekly challenges
- Exploration XP
- Area completion

## Phase 5 — Social

- Leaderboards
- Friends
- Teams
- Team challenges
- Competitive events

## Phase 6 — Intelligent Fitness

Potential future features:

- Personalized recommendations
- Adaptive challenges
- Activity insights
- AI-assisted fitness guidance
- Intelligent goal generation
- Personalized weekly plans

---

# 💡 Product Philosophy

ROVR should reward **consistency, exploration and progress**, not just raw athletic performance.

The system should encourage a user to think:

> "I just need to move today."

Then turn that movement into:

```text
Movement
   ↓
Activity
   ↓
Progress
   ↓
XP
   ↓
Challenge
   ↓
Achievement
   ↓
Motivation
   ↓
More Movement
```

---

# 🤝 Team

ROVR is developed collaboratively using GitHub-based feature branches and pull requests.

| Area | Responsibility |
|---|---|
| Product & Architecture | ROVR Core Team |
| Frontend | React Native / Expo Team |
| Backend | Node.js / Express Team |
| Database | MongoDB / Mongoose Team |
| Design | ROVR Design Team |
| Gamification | XP / Challenges Team |
| Documentation | ROVR Documentation Team |
| QA | ROVR Development Team |

Add individual contributors to this table as the team structure is finalized.

---

# 📚 Documentation

Project documentation should live inside:

```text
Docs/
```

Recommended documentation:

```text
Docs/
├── architecture/
├── api/
├── features/
├── gamification/
├── activity-tracking/
├── localization/
├── database/
└── development/
```

---

# 🛠️ Main Technologies

| Layer | Technology |
|---|---|
| Mobile | Expo + React Native |
| Navigation | Expo Router |
| Language | TypeScript / JavaScript |
| Animation | React Native Reanimated |
| HTTP | Axios |
| Local Storage | AsyncStorage |
| Backend | Node.js |
| API | Express.js |
| Database | MongoDB |
| ODM | Mongoose |
| Authentication | JWT / Supabase Auth |
| Password Hashing | bcryptjs |
| Maps | React Native map/GPS ecosystem |
| CI | GitHub Actions |
| Version Control | Git + GitHub |

---

# 📌 Project Status

**ROVR is actively under development.**

The project is currently focused on establishing a reliable foundation across:

- Mobile application
- Authentication
- Onboarding
- User wellness data
- Activity tracking
- Maps
- Gamification
- Challenges
- Documentation
- Developer workflow

Features described under the roadmap are planned or evolving and may not all be available in the current build.

---

# 📜 License

ROVR is distributed under the **MIT License**.

See [`LICENSE`](./LICENSE) for details.

---

# 🔗 Repository

**GitHub:** https://github.com/Lumowhisp/ROVR

---

## ⚡ ROVR

**Move. Train. Evolve.**

Built to turn movement into progress.
