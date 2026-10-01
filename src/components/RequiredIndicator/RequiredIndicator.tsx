import type { JSX } from "react";

import { Box } from "../Box";

import styles from "./RequiredIndicator.module.css";

/**
 * Asterisk that marks a required field's label. Hidden from assistive technology, since the control itself is
 * marked required.
 */
export function RequiredIndicator(): JSX.Element {
  return (
    <Box as="span" className={styles.requiredIndicator} aria-hidden="true">
      *
    </Box>
  );
}
