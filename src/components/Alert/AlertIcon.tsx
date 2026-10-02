import type { JSX } from "react";

import { Box } from "../Box";

import type { AlertTone } from "./Alert";

interface AlertIconProps {
  /**
   * Alert tone whose glyph to draw
   */
  tone: AlertTone;
}

const markPaths: Record<AlertTone, string> = {
  danger: "M15 9l-6 6M9 9l6 6",
  info: "M12 16v-4M12 8h.01",
  success: "M8 12.5l3 3 5-6",
  warning: "M12 10v4M12 17h.01",
};

/**
 * Decorative glyph for an alert tone, drawn in the current text colour and hidden from assistive
 * technology, since the alert's text carries the meaning
 */
export function AlertIcon({ tone }: AlertIconProps): JSX.Element {
  return (
    <Box
      as="svg"
      fill="none"
      height="1.25em"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      viewBox="0 0 24 24"
      width="1.25em"
      aria-hidden="true"
    >
      {tone === "warning" ? <Box as="path" d="M12 3L22 20H2z" /> : <Box as="circle" cx={12} cy={12} r={10} />}
      <Box as="path" d={markPaths[tone]} />
    </Box>
  );
}
