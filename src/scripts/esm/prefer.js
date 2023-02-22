export default {
  darkMode: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches,
  motion: window.matchMedia && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}