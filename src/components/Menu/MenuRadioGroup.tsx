import type { JSX, ReactNode } from "react";
import { useState } from "react";

import type { MenuGroupProps } from "./MenuGroup";
import { MenuGroup } from "./MenuGroup";
import { MenuRadioGroupContext } from "./MenuRadioGroupContext";

/**
 * Props for `MenuRadioGroup`: its label and selection plus every `MenuGroup` prop
 */
export interface MenuRadioGroupProps extends Omit<MenuGroupProps, "defaultValue" | "label" | "onChange"> {
  /**
   * The value of the item checked at first when uncontrolled
   */
  defaultValue?: string;

  /**
   * A heading shown above the group's items, which names the group
   */
  label: ReactNode;

  /**
   * Called with the value of the item the user checks, when it differs from the checked one
   */
  onValueChange?: (value: string) => void;

  /**
   * Controls which item is checked. Without it, the group holds its own choice, starting from `defaultValue`.
   */
  value?: string;
}

/**
 * A named group of `MenuItemRadio`s in a `Menu`, of which one is checked, such as a sort order. A click or Enter
 * checks an item and closes every open menu; Space checks it and leaves them open.
 *
 * @example
 * <MenuRadioGroup label="Sort by" onValueChange={setSortOrder} value={sortOrder}>
 *   <MenuItemRadio value="name">Name</MenuItemRadio>
 *   <MenuItemRadio value="modified">Date modified</MenuItemRadio>
 * </MenuRadioGroup>
 */
export function MenuRadioGroup({ defaultValue, onValueChange, value, ...rest }: MenuRadioGroupProps): JSX.Element {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const checkedValue = value ?? uncontrolledValue;

  function select(nextValue: string): void {
    if (nextValue === checkedValue) {
      return;
    }

    if (value === undefined) {
      setUncontrolledValue(nextValue);
    }

    onValueChange?.(nextValue);
  }

  return (
    <MenuRadioGroupContext.Provider value={{ select, value: checkedValue }}>
      <MenuGroup {...rest} />
    </MenuRadioGroupContext.Provider>
  );
}
