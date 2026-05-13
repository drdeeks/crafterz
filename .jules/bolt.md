## 2026-05-13 - [Memoization of Tabs and Derivations]
**Learning:** In a monolithic React component like MiniApp, global state updates (like a countdown or resource regeneration) trigger re-renders of the entire tree. Large derivations like filtering an inventory or calculating leaderboard rankings should be memoized. Functional components used as tabs should be wrapped in React.memo to prevent unnecessary re-renders when the parent's unrelated state (e.g., 'craftz' tokens) changes.
**Action:** Use useMemo for data filtering/mapping and React.memo for sub-components that receive stable props.
