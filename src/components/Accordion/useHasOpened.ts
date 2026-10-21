import { useState } from "react";

/**
 * Tells whether an item has been open at any time since it mounted
 *
 * @param open whether the item is open now
 * @returns true once the item has opened, including while it is open
 */
export function useHasOpened(open: boolean): boolean {
  const [hasOpened, setHasOpened] = useState(open);

  if (open && !hasOpened) {
    setHasOpened(true);
  }

  return hasOpened || open;
}
