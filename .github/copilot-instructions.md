# Copilot Instructions for LovableApp

## Project Overview
- **LovableApp** is a Vite + React + TypeScript web app for managing household inventory ("Vorratskammer").
- Uses **Supabase** for backend (auth, database, real-time updates).
- UI is built with **shadcn-ui** components and **Tailwind CSS**.
- State management and data fetching use **@tanstack/react-query**.

## Key Architecture & Patterns
- **Pages**: Located in `src/pages/` (e.g., Dashboard, Login, ShoppingList, Categories, NotFound).
- **Components**: Reusable UI in `src/components/` (including `ui/` for shadcn primitives).
- **Supabase Integration**: All DB/API logic in `src/lib/supabase-helpers.ts` and `src/integrations/supabase/`.
- **Real-time**: Dashboard subscribes to `articles` table changes via Supabase channel, auto-refreshing article data.
- **Barcode Scanning**: `BarcodeScanner` uses `html5-qrcode` for camera input and triggers stock dialogs.
- **Dialogs**: Stock changes and new articles are handled via modal dialogs (`StockChangeDialog`, `NewArticleDialog`).
- **Auth**: Managed via Supabase; see `useAuth` hook and `Login.tsx`.
- **UI State**: Minimal global state; most state is local to pages/components.

## Developer Workflows
- **Install**: `npm i`
- **Dev server**: `npm run dev` (Vite, hot reload)
- **Build**: `npm run build`
- **Preview**: `npm run preview`
- **Test**: `npm run test` (Vitest)
- **Lint**: `npm run lint`
- **Supabase**: Configure env vars in `.env` or via Vite's `import.meta.env` (see `src/integrations/supabase/client.ts`).

## Project Conventions
- **Absolute imports** use `@/` alias for `src/` (see `tsconfig.json`).
- **TypeScript** everywhere; types for Supabase in `src/integrations/supabase/types.ts`.
- **UI**: Use shadcn-ui and Tailwind for all new components; utility class merging via `cn()` in `src/lib/utils.ts`.
- **Data Fetching**: Always use `react-query` for server data; invalidate queries on mutations/real-time events.
- **Testing**: Place tests in `src/test/`.
- **No Redux or Context**: Prefer hooks and local state.

## Integration Points
- **Supabase**: All DB/auth/storage via Supabase client; never direct REST calls.
- **Real-time**: Use Supabase channel for live updates (see Dashboard page).
- **Barcode**: Use `BarcodeScanner` for all camera-based input.

## Examples
- See `Dashboard.tsx` for real-time data, barcode scan, and dialog orchestration.
- See `supabase-helpers.ts` for all DB access patterns.
- See `useAuth.tsx` for authentication state management.

---

**When in doubt, follow the patterns in `Dashboard.tsx` and `supabase-helpers.ts`.**
