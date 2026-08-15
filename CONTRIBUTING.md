# Contributing to ROVR

Thank you for your interest in contributing to **ROVR**. This document provides guidelines for contributing code, reporting bugs, and proposing enhancements to ensure a consistent, maintainable codebase.

---

## Code of Conduct

All contributors are expected to adhere to our [Code of Conduct](./CODE_OF_CONDUCT.md) in all project spaces, discussions, and code reviews.

---

## Workspace Structure

The repository is structured into two core directories:
- `/frontend` — Expo SDK 56 React Native mobile client.
- `/backend` — Express.js REST API service with MongoDB.

---

## Development Workflow

### 1. Prerequisites
Ensure the following tools are installed locally:
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **Git**: Configured with your GitHub credentials
- **Expo Go**: Installed on iOS or Android for physical device testing

---

### 2. Fork and Clone
```bash
git clone https://github.com/your-username/ROVR.git
cd ROVR
```

---

### 3. Branching Strategy
Create a descriptive branch off `main` following standard naming conventions:

```bash
git checkout -b feature/cycle-prediction-model
# or
git checkout -b fix/auth-token-refresh
```

Branch prefixes:
- `feature/` — New feature or major enhancement
- `fix/` — Bug fix or error resolution
- `docs/` — Documentation updates and specifications
- `refactor/` — Code restructuring without functional changes
- `test/` — Unit, integration, or end-to-end test additions

---

## Engineering Standards

### Frontend (React Native & Expo)
- **TypeScript**: All new source files must use TypeScript (`.ts` or `.tsx`).
- **Path Aliases**: Use `@/` for imports relative to `frontend/src/` (for example, `@/context/AuthContext`, `@/services/api`).
- **Type Safety**: Verify TypeScript compilation passes without errors:
  ```bash
  cd frontend
  npm run typecheck
  ```
- **Linting**: Ensure code adheres to project ESLint standards:
  ```bash
  npm run lint
  ```
- **Animations**: Use `react-native-reanimated` with `runOnUI` or worklets to prevent thread-blocking calculations.

### Backend (Node.js & Express)
- **Module System**: Use ECMAScript Modules (`import`/`export`). CommonJS `require` is not permitted.
- **Controller Design**: Encapsulate business logic in asynchronous controller functions wrapped with standard `try...catch` blocks and structured JSON responses (`{ message: string, data?: object }`).
- **Database Models**: Place Mongoose schemas in `backend/src/models/` with `timestamps: true` enabled.
- **Security**: Never hardcode secrets or connection strings. Use environment variables defined in `backend/.env`.

---

## Commit Message Guidelines

We enforce Conventional Commits:

```text
feat(auth): add email validation and haptic feedback to sign-up
fix(api): improve dynamic host IP resolution for local network testing
docs(readme): update system architecture diagram and setup guide
refactor(hydration): restructure calculation engine into dedicated service
```

---

## Pull Request Process

1. Rebase your feature branch onto the latest `main`:
   ```bash
   git fetch origin
   git rebase origin/main
   ```
2. Run local verification:
   ```bash
   # In frontend/
   npm run lint
   npm run typecheck
   ```
3. Push your branch to GitHub:
   ```bash
   git push origin feature/your-feature-name
   ```
4. Submit a Pull Request targeting `main`. Provide:
   - A concise summary of changes
   - Associated issue numbers (if applicable)
   - Screenshots or video demonstrations for UI updates
   - Verification steps taken

---

## License

By contributing to ROVR, you agree that your contributions will be licensed under the project's [MIT License](./LICENSE).
