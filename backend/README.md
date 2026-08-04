# ⚙️ ROVR Backend — Node.js & Express REST API

The **ROVR Backend** is a Node.js RESTful API service built with **Express.js 5.x**, **MongoDB**, **Mongoose**, and **JSON Web Tokens (JWT)**. It powers user authentication, hydration tracking, and profile management for the ROVR fitness platform.

---

## 📂 Codebase File & Folder Structure

```
backend/
├── server.js                  # Entry point (connects DB & starts HTTP listener on port 3000)
├── package.json               # Backend dependencies and scripts
├── .env                       # Environment variables (Mongo URI, JWT Secret)
└── src/
    ├── app.js                 # Express application setup, logger middleware & route mapping
    ├── config/
    │   ├── config.js          # Environment variable validation & exports
    │   └── dataBase.js        # MongoDB connection handler via Mongoose
    ├── controller/
    │   └── auth.control.js    # Sign Up & Sign In controllers (bcrypt hashing, JWT generation)
    ├── Middleware/
    │   └── protect.js         # Bearer token verification middleware
    ├── models/
    │   ├── user.model.js      # User schema (auth, BMI, weight, height, hydration settings)
    │   └── dailyHydration.model.js # Hydration entry schema
    ├── routes/
    │   ├── auth.route.js      # Authentication endpoints (/signup, /signin)
    │   ├── onboard.route.js   # User onboarding endpoints
    │   └── profile.route.js   # User profile endpoints
    └── services/
        ├── hydration.js       # Hydration tracking logic
        ├── onboard.js         # User onboarding logic
        └── profile.js         # User profile update logic
```

---

## 🔌 API Reference & Endpoints

### 🔑 Authentication Routes (`/api/auth`)

#### 1. Sign Up (`POST /api/auth/signup`)
Creates a new user account, hashes the password using `bcryptjs`, generates a JWT, and returns the created user object.

- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Success Response (201 Created)**:
  ```json
  {
    "message": "User Created Successfully",
    "user": {
      "_id": "66ae5b1c...",
      "name": "John Doe",
      "email": "john@example.com",
      "createdAt": "2026-08-04T12:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsIn..."
  }
  ```

#### 2. Sign In (`POST /api/auth/signin`)
Authenticates existing credentials and returns a 7-day signed JWT token.

- **Request Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Success Response (200 OK)**:
  ```json
  {
    "message": "User Authenticated",
    "token": "eyJhbGciOiJIUzI1NiIsIn..."
  }
  ```

---

### 🛡️ Protected Routes Middleware (`protect.js`)

Protected endpoints require a `Authorization: Bearer <token>` header:

```javascript
import { protect } from '../Middleware/protect.js';
router.get('/profile', protect, getProfile);
```

---

## ⚙️ Setup & Execution

### 1. Environment Configuration (`backend/.env`)
Ensure your `.env` file contains:

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/rovr
JWT_SECRET=rovr_super_secret_key
```

### 2. Run Development Server
```bash
npm run dev
```
*The server starts at `http://localhost:3000` with live reload via Nodemon.*
