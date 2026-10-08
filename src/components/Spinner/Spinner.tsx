import { clsx } from "clsx";
import type { JSX } from "react";

import { Box } from "../Box";

import styles from "./Spinner.module.css";

interface SpinnerProps {
  /**
   * Class names merged with the spinner's own, for positioning it
   */
  className?: string;
}

/**
 * A rotating arc in `currentColor`, 1em square, hidden from assistive technology. Whatever shows it must also tell
 * screen readers that something is happening, for example with a status message.
 */
export function Spinner({ className }: SpinnerProps): JSX.Element {
  return (
    <Box
      as="svg"
      className={clsx(styles.spinner, className)}
      fill="none"
      focusable="false"
      viewBox="0 0 16 16"
      aria-hidden={true}
    >
      <Box
        as="circle"
        cx={8}
        cy={8}
        r={6}
        stroke="currentColor"
        strokeDasharray="28 10"
        strokeLinecap="round"
        strokeWidth={2}
      />
    </Box>
  );
}
