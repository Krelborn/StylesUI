// Bundled ahead of the components through `extraEntries`, so the reset, tokens and themes precede component CSS as
// the README's "import styles.css at your app root" order has it. Appended after them through `cssEntry`, the reset's
// `* { margin: 0 }` beats Overlay's zero-specificity margin and tooltips touch their triggers.
import "../dist/styles.css";
