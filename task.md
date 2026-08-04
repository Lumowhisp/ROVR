# 🌸 ROVR Women's Wellness Module — Task List

A complete, role-based implementation task checklist created from the **ROVR Women's Wellness Developer Spec**.

---

## 👥 Team Role Assignments

| Member Name | Assigned Role | Assigned Module / Tasks |
|---|---|---|
| **Aditya** (`@Lumowhisp`) | **Lead Architect** | Overall Architecture, Expo App Integration & Auth Flow |
| *[ Team Member 1 ]* | **Database & Backend Lead** | Phase 1 (Database Schemas) & Phase 2 (Cycle Prediction & APIs) |
| *[ Team Member 2 ]* | **Frontend / Mobile UI Engineer** | Phase 3 (Cycle Calendar, Symptom Tracker & Vibe Check Screens) |
| *[ Team Member 3 ]* | **Gamification Specialist** | Phase 4 (XP Triggers, Hydration & Nutrition Goals) |
| *[ Team Member 4 ]* | **Security & Privacy Lead** | Phase 5 (Notifications) & Phase 6 (Encryption & GDPR Compliance) |

---

## 🗄️ Database & Backend Team (`backend/`)

- [ ] **Data Models (`backend/src/models/`)**
  - [ ] `cycle.model.js`: `userId`, `cycleStart`, `cycleEnd`, `cycleLength`, `periodLength`, `predictionConfidence`
  - [ ] `dailyLog.model.js`: `userId`, `date`, `flow`, `painLevel`, `symptoms[]` (physical & mental), `mood`, `notes`, `hydration`, `sleep`
  - [ ] `trustedContact.model.js`: `userId`, `name`, `relation`, `phone`, `notificationsEnabled`

- [ ] **Cycle Engine & Prediction Logic (`backend/src/services/`)**
  - [ ] Implement phase calculator: `Menstrual`, `Follicular`, `Ovulation`, `Luteal`
  - [ ] Implement prediction algorithm for next period, ovulation window, and fertile days
  - [ ] Calculate prediction confidence score based on historical cycle variance

- [ ] **API Endpoints (`backend/src/routes/` & `backend/src/controller/`)**
  - [ ] `POST /api/wellness/cycle` — Log period start/end
  - [ ] `GET /api/wellness/cycle` — Get active cycle & current phase
  - [ ] `POST /api/wellness/daily-log` — Create daily log
  - [ ] `GET /api/wellness/recommendations` — Fetch phase-specific recommendations
  - [ ] `GET /api/wellness/calendar` — Fetch monthly cycle calendar data
  - [ ] `POST /api/wellness/trusted-contact` — Add trusted contact
  - [ ] `DELETE /api/wellness/trusted-contact` — Remove trusted contact
  - [ ] `GET /api/wellness/insights` — Return AI observational patterns

---

## 📱 Mobile UI & Frontend Team (`frontend/`)

- [ ] **Screens & Layouts (`frontend/src/app/`)**
  - [ ] `app/(tabs)/wellness.tsx`: Women's Wellness main dashboard & phase dial
  - [ ] `app/wellness/trusted-contacts.tsx`: Trusted contacts management screen

- [ ] **UI Components (`frontend/src/components/wellness/`)**
  - [ ] **Cycle Calendar Component**: Color coding (🔴 Red: Period, 🔵 Blue: Ovulation, 🟡 Yellow: Fertile Window, ⚪ Gray: Predicted Days, 🟢 Green: Completed Logs)
  - [ ] **Daily Log Modal**: Flow intensity picker, pain level slider (1-10), physical/mental symptom tag grid
  - [ ] **Mood / Vibe Check Widget**: Energy, stress, mood, sleep sliders with non-medical advice generator & medical disclaimer footer
  - [ ] **Smart Recommendation Cards**: Phase-specific Food (iron-rich, protein, calcium, magnesium), Workout (low, high, peak, moderate intensity), and Hydration advice

---

## 🎮 Gamification Team (XP Integration)

- [ ] Daily log submission $\rightarrow$ **+5 XP**
- [ ] Mood check-in completion $\rightarrow$ **+3 XP**
- [ ] Complete cycle logged $\rightarrow$ **+20 XP**
- [ ] Hydration target met $\rightarrow$ **+2 XP**
- [ ] Phase nutrition goal followed $\rightarrow$ **+5 XP**

---

## 🔔 Notifications & Security Team

- [ ] **Push Notifications**: Period expected tomorrow, Ovulation approaching, Hydration reminders, Phase workout recommendations
- [ ] **Privacy & Compliance**: Health data encryption at rest, GDPR export & deletion endpoints (`/api/wellness/user-data`), explicit consent modal for trusted contacts
