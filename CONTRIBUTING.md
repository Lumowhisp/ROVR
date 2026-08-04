# Contributing to ROVR

Thank you for your interest in contributing to **ROVR**! We welcome contributions from developers of all skill levels. This document outlines the guidelines and procedures for contributing code, reporting bugs, and suggesting enhancements.

---

## Code of Conduct

Please maintain a respectful, inclusive, and professional environment across all project discussions, issue comments, and pull requests.

---

## Getting Started

### 1. Fork & Clone
Fork the repository on GitHub, then clone your fork locally:

```bash
git clone https://github.com/your-username/ROVR.git
cd ROVR
```

### 2. Workspace Structure
ROVR is organized into two primary project directories:
- `/frontend` — Expo SDK 56 React Native mobile application
- `/backend` — Express.js REST API with MongoDB & JWT authentication

### 3. Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Expo Go**: Installed on iOS or Android for mobile device testing
- **MongoDB**: Local instance or MongoDB Atlas connection string

---

## Development Workflow

### Branch Naming Conventions
Create a descriptive feature branch off `main`:

```bash
git checkout -b feature/auth-redesign
# or
git checkout -b fix/jwt-refresh-handling
```

Prefix branch names with one of the following:
- `feature/` — New feature or major enhancement
- `fix/` — Bug fix or patch
- `docs/` — Documentation updates
- `refactor/` — Code restructuring without behavior changes
- `test/` — Unit or integration test additions

---

## Code Standards & Guidelines

### Frontend (React Native & Expo)
- **TypeScript**: All new code must be written in TypeScript (`.ts` / `.tsx`).
- **Path Aliases**: Use `@/` for imports relative to `frontend/src/` (e.g., `@/context/AuthContext`, `@/services/api`).
- **UI Styling**: Use dark-mode ready color palettes (`#0A0A0F` base background, `#6C63FF` primary, `#00D4FF` secondary accents).
- **Animations**: Use `react-native-reanimated` for smooth 60 FPS UI transitions.
- **Type Check**: Always verify that your changes compile without errors:
  ```bash
  cd frontend
  npx tsc --noEmit
  ```

### Backend (Express & Node.js ES Modules)
- **ES Modules**: Use `import`/`export` syntax (do not use `require`).
- **Async Handling**: Wrap controller logic in `try...catch` blocks with standardized JSON error responses `{ message: string }`.
- **Database Schemas**: Place Mongoose models in `backend/src/models/`. Always include `timestamps: true`.
- **Security**: Never expose sensitive keys in code; use `backend/.env`.

---

## Commit Message Format

We follow Conventional Commits:

```bash
feat(auth): add email validation and shake animation to sign-up
fix(api): resolve dynamic host IP detection for mobile hotspot
docs(readme): update backend route definitions and setup guide
```

---

## Submitting a Pull Request

1. Sync your feature branch with `main`:
   ```bash
   git fetch origin
   git rebase origin/main
   ```
2. Verify all TypeScript checks and linters pass.
3. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
4. Open a Pull Request on GitHub targeting `main`. Include:
   - Clear title and summary of changes
   - Reference to any related issues
   - Screenshots/videos for UI changes

---

## License

By contributing to ROVR, you agree that your contributions will be licensed under the project's [MIT License](./LICENSE).
