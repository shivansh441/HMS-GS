# My Admin Portal

This project is a React + TypeScript + Vite admin portal frontend. It uses React Router for navigation, Redux Toolkit for state management, custom hooks for reusable logic, and Tailwind CSS for styling. This README has been merged and updated to reflect recent additions (services and Redux slices) used by the app.

## Quick Start

Install and run the development server:

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```

## Folder Structure (high level)

my-admin-portal/
- public/                  # Static assets
- src/
	- App.tsx                # Main app component
	- main.tsx               # App entry point
	- index.css              # Global styles and Tailwind setup
	- components/            # UI components (atoms, molecules, organisms)
	- pages/                 # Route-based pages
	- router/                # Route configuration and route guards
	- store/                 # Redux store, hooks and slices
	- hooks/                 # Custom React hooks
	- services/              # API/service logic
	- utils/                 # Helper functions
	- constants/             # App constants
	- config/                # Environment/config helpers
	- types/                 # TypeScript types/interfaces
	- layouts/               # Shared layouts and app shell
	- context/               # React context providers
- package.json
- vite.config.ts
- tsconfig.json

## Recent Additions (what changed)

- `src/services/propertyService.ts` — thin API wrapper for fetching properties.
- `src/store/slices/propertySlice.ts` — Redux Toolkit slice + async thunk `fetchProperties`.
- `src/components/molecules/PropertySelector.tsx` — now wired to Redux via `useAppDispatch`/`useAppSelector` and dispatches `fetchProperties` when needed.
- `src/store/store.ts` — registered the `properties` reducer alongside `auth` and keeps auth persisted.
- `src/store/hooks.ts` — typed hooks `useAppDispatch` / `useAppSelector` (existing, used by the new slice).

These changes centralize property fetching and make the data available application-wide through Redux. The backend continues to enforce role/tenant scoping — the frontend calls `/api/properties` and relies on server-side filtering.

## Architecture Notes

- Redux Toolkit is used for shared auth and app-level data such as properties.
- Services under `src/services` provide thin wrappers around fetch calls — keep API details isolated for easier testing and reuse.
- UI components (atoms/molecules/organisms) remain presentation-focused and consume data via hooks/selectors.

## Files of interest

- `src/services/propertyService.ts` — API wrapper for properties.
- `src/store/slices/propertySlice.ts` — RTK slice + `fetchProperties` thunk.
- `src/store/store.ts` — store configuration and persisted auth.
- `src/components/molecules/PropertySelector.tsx` — selector UI, now uses Redux.
- `src/config/env.config.ts` — `API_BASE_URL` used by services.

## Notes & Next Steps

- The `PropertySelector` currently dispatches `fetchProperties()` automatically when no `hostels` prop is provided; add loading/error UI if desired.
- The backend's auth rate limiter was temporarily relaxed during development — ensure it is guarded for production.

If you'd like, I can:

- add a loading spinner and error message to the property selector, or
- revert/guard the backend rate limiter so it's active only in production.

Happy to implement whichever you'd prefer next.

