# React Component Rules

## File Structure
- Components in `components/` directory
- Services in `services/` directory
- Types in `types.ts`
- Utilities in `utils/`

## Component Patterns
- Use functional components with hooks
- Keep state close to where it's used
- Use refs for values that shouldn't trigger re-renders (e.g., `isRecordingRef`)
- Sync ref values with state via useEffect when needed for callbacks

## Styling
- Tailwind CSS for all styling
- Custom colors defined in `tailwind.config.js`:
  - `terminal-green`: #00FF41 (primary accent)
  - `terminal-bg`: #0c0c0c (background)
- Use opacity modifiers: `bg-terminal-green/10`, `border-terminal-green/30`
- Animation classes: `animate-in`, `fade-in`, `slide-in-from-*`

## State Management
- Local state with useState for UI state
- useRef for mutable values (MediaRecorder, AudioContext, etc.)
- No global state management needed - single component app

## TypeScript
- Define interfaces in `types.ts`
- Use `// @ts-ignore` sparingly for Electron window extensions
- Prefer explicit types over `any` where practical
