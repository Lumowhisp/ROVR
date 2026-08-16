# 🌸 ROVR Women's Wellness Module — Implementation Tasks

Comprehensive task tracker for building the **ROVR Women's Wellness Companion** module based on the Developer README specifications.

---

## 👥 Team & Role Assignments

| Member Name               | Role                        | Phase Responsibilities                                               |
| ------------------------- | --------------------------- | -------------------------------------------------------------------- |
| **Aditya** (`@Lumowhisp`) | **Lead Architect**          | System Design, Auth Integration, API Interceptors                    |
| _[ Team Member 1 ]_       | **Database & Backend Lead** | Phase 1 (Mongoose Schemas) & Phase 2 (Prediction Engine & REST APIs) |
| _[ Abhishek Binwal ]_     | **Frontend Mobile UI Lead** | Phase 3 (Cycle Calendar, Symptom Tracker Modal & Recommendations)    |
| \*\*                      | **Gamification Specialist** | Phase 4 (XP Rewards Logic & Hydration/Nutrition Integration)         |
| _[ Team Member 4 ]_       | **Security & Privacy Lead** | Phase 5 (Push Notifications) & Phase 6 (Data Encryption & Consent)   |

---

## Phase 1: Database & Mongoose Schemas (`backend/src/models`)

- [ ] **1.1 Cycle Schema (`cycle.model.js`)**
  - [ ] Define `userId` (ObjectId ref User, required, indexed)
  - [ ] Define `cycleStart` (Date, required)
  - [ ] Define `cycleEnd` (Date)
  - [ ] Define `cycleLength` (Number, default: 28)
  - [ ] Define `periodLength` (Number, default: 5)
  - [ ] Define `predictionConfidence` (Number, scale 0-100)
  - [ ] Add timestamps (`createdAt`, `updatedAt`)

- [ ] **1.2 Daily Log Schema (`dailyLog.model.js`)**
  - [ ] Define `userId` and `date` (Unique compound index per user per day)
  - [ ] Define `flow` (Enum: `['Light', 'Medium', 'Heavy', 'Spotting', 'None']`)
  - [ ] Define `painLevel` (Number 1-10)
  - [ ] Define `symptoms` array:
    - [ ] Physical: `['Cramps', 'Headache', 'Back pain', 'Acne', 'Fatigue', 'Bloating', 'Breast tenderness']`
    - [ ] Mental: `['Happy', 'Sad', 'Irritated', 'Emotional', 'Anxious', 'Calm', 'Motivated']`
  - [ ] Define `mood` (String)
  - [ ] Define `notes` (String)
  - [ ] Define `hydration` (Number in mL)
  - [ ] Define `sleep` (Number in hours)

- [ ] **1.3 Trusted Contact Schema (`trustedContact.model.js`)**
  - [ ] Define `userId` (ObjectId ref User)
  - [ ] Define `name`, `relation`, `phone`
  - [ ] Define `notificationsEnabled` (Boolean, default: false)
  - [ ] Add explicit user consent timestamp

---

## Phase 2: Backend Logic & API Routes (`backend/src/`)

- [ ] **2.1 Cycle Prediction Engine (`backend/src/services/cycleEngine.js`)**
  - [ ] Calculate current phase (`Menstrual`, `Follicular`, `Ovulation`, `Luteal`) based on cycle start and average length
  - [ ] Predict next period date and fertile window (Ovulation ± 2 days)
  - [ ] Compute confidence score based on historical cycle variance

- [ ] **2.2 Phase-Based Recommendation Engine (`backend/src/services/wellnessRecommendations.js`)**
  - [ ] **Menstrual Phase**: Food (spinach, beetroot, dates, iron-rich, ginger tea), Workout (walking, stretching, yoga), Hydration advice
  - [ ] **Follicular Phase**: Food (protein, fruits, eggs, paneer), Workout (strength training, running, HIIT)
  - [ ] **Ovulation Phase**: Food (calcium, fruits, coconut water), Workout (cardio, sports, strength)
  - [ ] **Luteal Phase**: Food (magnesium-rich, nuts, dark chocolate, banana), Workout (light gym, yoga, mobility)

- [ ] **2.3 Express Controllers & Routes (`backend/src/controller/wellness.control.js`)**
  - [ ] `POST /api/wellness/cycle` — Log new period start/end
  - [ ] `GET /api/wellness/cycle` — Get current active cycle status & phase
  - [ ] `POST /api/wellness/daily-log` — Submit daily symptom/mood/flow log
  - [ ] `GET /api/wellness/recommendations` — Fetch current phase recommendations (Food, Workout, Hydration, Vibe check)
  - [ ] `GET /api/wellness/calendar` — Fetch monthly cycle calendar data (color-coded events)
  - [ ] `POST /api/wellness/trusted-contact` — Add trusted contact with consent check
  - [ ] `DELETE /api/wellness/trusted-contact` — Remove trusted contact
  - [ ] `GET /api/wellness/insights` — Return observational AI insights (pattern detection)

---

## Phase 3: Frontend Expo UI Components (`frontend/src/`)

- [ ] **3.1 Cycle Navigation & Dashboard Screen (`app/(tabs)/wellness.tsx`)**
  - [ ] Phase status wheel / progress indicator with current phase badge
  - [ ] Day of cycle counter & upcoming period countdown
  - [ ] Quick log action button (+ Log Symptoms)

- [ ] **3.2 Interactive Cycle Calendar (`components/wellness/cycle-calendar.tsx`)**
  - [ ] Red highlight for period days
  - [ ] Blue highlight for predicted ovulation
  - [ ] Yellow highlight for fertile window
  - [ ] Gray highlight for predicted days
  - [ ] Green checkmark for completed daily logs

- [ ] **3.3 Daily Log Modal (`components/wellness/daily-log-modal.tsx`)**
  - [ ] Flow intensity selector pill picker
  - [ ] Pain level slider (1-10 with visual indicator)
  - [ ] Multi-select grid for Physical symptoms & Mental moods
  - [ ] Notes text field & hydration/sleep input

- [ ] **3.4 Mood / Vibe Check Widget (`components/wellness/vibe-check.tsx`)**
  - [ ] Energy, stress, sleep, and motivation check-in sliders
  - [ ] Supportive non-medical advice generator
  - [ ] Medical disclaimer banner ("Observational wellness guidance only — Not medical advice")

- [ ] **3.5 Phase Recommendations Cards (`components/wellness/recommendations-card.tsx`)**
  - [ ] Recommended Nutrition card (Phase-specific food pills)
  - [ ] Recommended Workout card (Phase-matched workout intensity tag)
  - [ ] Hydration goal progress bar

- [ ] **3.6 Trusted Contacts Screen (`app/wellness/trusted-contacts.tsx`)**
  - [ ] Add/remove trusted contact form
  - [ ] Support notification toggle with explicit consent warning modal

---

## Phase 4: XP Gamification Integration (`frontend/src/context/` & `backend/src/services/`)

- [ ] **4.1 XP Reward Triggers**
  - [ ] Award **+5 XP** on daily symptom log completion
  - [ ] Award **+3 XP** on daily mood vibe check
  - [ ] Award **+20 XP** on complete cycle logged
  - [ ] Award **+2 XP** on meeting daily hydration target
  - [ ] Award **+5 XP** on following phase nutrition goal

---

## Phase 5: Push Notifications & Reminders

- [ ] **5.1 Notification Triggers (`expo-notifications`)**
  - [ ] Remind "Period expected tomorrow"
  - [ ] Remind "Ovulation window approaching"
  - [ ] Remind "Hydration check: Drink more water today"
  - [ ] Remind "Log today's symptoms & vibe check"
  - [ ] Remind "New phase workout recommendation available"

---

## Phase 6: Privacy, Data Security & Compliance

- [ ] **6.1 Security & Privacy Controls**
  - [ ] Encrypt sensitive health data in database
  - [ ] Implement `DELETE /api/wellness/user-data` for complete data erasure (GDPR compliance)
  - [ ] Implement `GET /api/wellness/export-data` for data export
  - [ ] Enforce strict permission boundaries for trusted contact notifications

---

## Verification & Testing

- [ ] Run backend unit tests for cycle phase calculation
- [ ] Test API endpoints with valid JWT auth header
- [ ] Run `npx tsc --noEmit` on frontend to verify 0 TypeScript errors
- [ ] Verify UI layout responsiveness across iOS and Android
