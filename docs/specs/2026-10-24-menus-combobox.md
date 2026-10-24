# Spec: Menus, `combobox` module

The fifth and last module of the [menus capability map](2026-10-21-menus.md): the [combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) pattern with a `listbox` popup, in its two forms. A select-only combobox is a field like a `Select` whose list can hold rich options, such as people with avatars. An editable combobox is a text input that filters its list as the user types. It follows every decision, the visual language and the accessibility baseline in the map. Its list is drawn on the [`menu` module](2026-10-21-menus-menu.md)'s surface, and it shares Listbox's option ids and type-ahead. This spec adds the API, the behaviour in full and the criteria it is tested against.

## Objective

App developers building forms and toolbars get two pickers:

- **A rich select.** Choosing an assignee, a status or a project from a list whose options carry an avatar, an icon or a line of description, where a native `Select` can show only text.
- **An autocomplete.** Choosing one of many options, such as a country or a teammate, by typing part of its name, with the list filtered as they type, by StylesUI or by their own server.

The developer writes the control and its options, inside a `Field` or with an `aria-label`, and writes no focus, keyboard, pointer, filtering or ARIA code.

Success: an assignee picker with avatars and an autocomplete over the world's countries, each in a `Field`, built from StylesUI components alone, passing their keyboard stories and axe in all four storybook projects.

## Decisions

- **Two controls, one option.** `Combobox` is the select-only form: a `button` with the `combobox` role. `Autocomplete` is the editable form: an `input` with the `combobox` role and `aria-autocomplete="list"`. Both hold `ComboboxOption`s. They take different element props, and a consumer reaching for an autocomplete looks for that word, so they are two components rather than one with a switch (see Open Questions).
- **Focus stays in the control.** As the capability map decided, the button or input keeps focus while the list is open, and `aria-activedescendant` names the active option. Options never take focus: a press on one keeps focus where it is.
- **Choose from the list only.** The value is always an option's `value`, or null for none. Text typed into an `Autocomplete` that matches no option is never the value: when focus leaves, the input shows the selected option's text again, or is empty when nothing is selected. Free text and creating options are out of scope, as the map says.
- **Moving never commits.** The arrow keys, Home, End, type-ahead and the pointer move the active option only. Enter, a click or a tap commits it. Tab and focus leaving close the list without committing, so an option the user passed on the way does not become the value (3.2.2). This differs from the APG's select-only example, where Tab commits (see Open Questions).
- **Typing makes the first match active.** In an `Autocomplete`, each change to the text makes the first option that matches, and is not disabled, the active one, so Enter after typing "Fra" chooses France. Nothing is completed inline in the input. This is the APG's "list autocomplete with automatic selection" (see Open Questions).
- **StylesUI filters unless told not to.** By default an `Autocomplete` hides each option whose text does not contain the typed text, ignoring case and accents. `filter` takes another test, or `null` to show every option the consumer renders, for a list filtered on a server. A hidden option is still mounted, so the selection and its label survive filtering.
- **The count is announced.** An `Autocomplete` holds a polite live region that says how many options match, once typing pauses for 500ms, the type-ahead window (4.1.3). Its text comes from `resultsLabel`, which defaults to English ("No results", "1 result", "12 results"), as `NavBar`'s `menuLabel` does.
- **A manual popover.** The list is a `popover="manual"` overlay, as `Tooltip` is, rather than `auto`. Focus stays in the control, so the control's own blur and Escape close the list, and an `auto` popover's light dismiss would close it on a click in the input that opened it. It renders in place in the DOM, positioned with anchor positioning under the control, so it keeps the theme around it. The list is always mounted, hidden while closed, so `aria-controls` always names an element and the selected option can show its label in the field.
- **The field shows the selected option.** A closed `Combobox` shows the selected option's leading content and label, without its description, or the `placeholder` when nothing is selected. The selected option hands them to the field before the first paint. In server-rendered HTML the field shows the placeholder until the page hydrates.
- **Looks like the other fields.** Both controls take `TextControl`'s look and `size` (`sm`, `md` and `lg`), with `Select`'s chevron at the inline end. `TextControl` gains `button` as an element it renders. The list is the menu surface at the `default` density, at least as wide as the field.
- **The menu's highlight.** The active option takes the menu's highlight tokens, so `--sui-menu-highlight` restyles a combobox's list too (map criterion 5). Moved there by a key, it also draws the inset focus ring, as a menu item does under `:focus-visible`; under the pointer, only the tint. The selected option shows `CheckIcon` in the leading column, which a combobox's list always shows, so labels line up whether or not an option has its own icon.
- **Listbox's internals move to `src/collections/`.** `optionId` and `renderedOptions`, which both lists need, move there from `src/components/Listbox/`, and `Listbox` imports them from there. Its behaviour does not change and its tests pass unchanged. `useListbox` stays Listbox's: a listbox holds focus itself, which a combobox's list does not.
- **Forms.** `name` adds a hidden input holding the selected value, so both controls submit with a form. Inside a `Field`, both take its id, description, invalid, required and disabled state through `useFieldControl`, and the field's label names them. `required` sets `aria-required`; constraint validation, which a hidden input never takes part in, is the form's own (see Boundaries).

## API

```tsx
// src/components/Combobox/Combobox.tsx
interface ComboboxOwnProps {
  /** The `ComboboxOption`s */
  children?: ReactNode;
  /** The option selected at first, which leaves the combobox uncontrolled. Defaults to none. */
  defaultValue?: string | null;
  /** Adds a hidden input that submits the selected value with a form under this name */
  name?: string;
  /** Called with the value of the option the user commits */
  onValueChange?: (value: string) => void;
  /** Where the list opens, `bottom-start` or `top-start`, flipping when there is no room. Defaults to `bottom-start`. */
  placement?: "bottom-start" | "top-start";
  /** Shown in the field while no option is selected */
  placeholder?: ReactNode;
  /** Height of the field, matching the `Button` sizes. Defaults to `md`. */
  size?: ControlSize;
  /** The selected option, or null for none, which makes the combobox controlled */
  value?: string | null;
}

export type ComboboxProps = ComboboxOwnProps &
  Omit<
    BoxProps<"button">,
    | "aria-activedescendant"
    | "aria-autocomplete"
    | "aria-controls"
    | "aria-expanded"
    | "aria-haspopup"
    | "as"
    | "defaultValue"
    | "role"
    | "type"
    | "value"
    | keyof ComboboxOwnProps
  >;

// src/components/Combobox/Autocomplete.tsx
interface AutocompleteOwnProps {
  children?: ReactNode;
  defaultInputValue?: string;
  defaultValue?: string | null;
  /** Whether an option shows for the typed text. Defaults to containing it, ignoring case and accents; null shows every option. */
  filter?: ((textValue: string, inputValue: string) => boolean) | null;
  /** The typed text, which makes it controlled: update it from `onInputValueChange` */
  inputValue?: string;
  name?: string;
  /** Called with the text as the user types, and with an option's text when they commit it */
  onInputValueChange?: (inputValue: string) => void;
  /** Called with the committed option's value, or null when the user clears the input */
  onValueChange?: (value: string | null) => void;
  placement?: "bottom-start" | "top-start";
  /** What the live region says for a number of matching options. Defaults to English. */
  resultsLabel?: (count: number) => string;
  size?: ControlSize;
  value?: string | null;
}

export type AutocompleteProps = AutocompleteOwnProps &
  Omit<
    BoxProps<"input">,
    | "aria-activedescendant"
    | "aria-autocomplete"
    | "aria-controls"
    | "aria-expanded"
    | "as"
    | "children"
    | "dangerouslySetInnerHTML"
    | "defaultValue"
    | "role"
    | "size"
    | "type"
    | "value"
    | keyof AutocompleteOwnProps
  >;

// src/components/Combobox/ComboboxOption.tsx
export interface ComboboxOptionProps extends Omit<
  BoxProps<"div">,
  "aria-disabled" | "aria-label" | "aria-labelledby" | "aria-selected" | "as" | "children" | "id" | "role" | "tabIndex"
> {
  /** Not accepted: the label names the option */
  "aria-label"?: never;
  "aria-labelledby"?: never;
  /** The label, which names the option */
  children: ReactNode;
  /** A line of muted text below the label, which describes the option */
  description?: ReactNode;
  /** Whether the option can be reached but not chosen. Defaults to `false`. */
  disabled?: boolean;
  /** Content before the label, such as an `Avatar` or an icon, which the field shows too when the option is selected */
  leading?: ReactNode;
  /** The text filtering, type-ahead and the input match. Defaults to the label's text. */
  textValue?: string;
  /** The value this option stands for */
  value: string;
}
```

- **`Combobox`** renders a `button` with the `combobox` role, `aria-haspopup="listbox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant` while an option is active, and `type="button"`, holding the selected option's leading content and label or the placeholder, followed by the list. Its props go to the button. Inside a `Field` the field's label names it; outside one, give it `aria-label` or `aria-labelledby`, as `Select` asks.
- **`Autocomplete`** renders an `input` with the `combobox` role, `aria-autocomplete="list"`, `aria-expanded`, `aria-controls` and `aria-activedescendant` while an option is active, followed by the list and the live region. Its props go to the input, whose `autoComplete` defaults to `off`.
- **The list** is a `div` with the `listbox` role, named by whatever names the control, holding the options. It is the overlay.
- **`ComboboxOption`** renders a `div` with the `option` role, `aria-selected` and `aria-disabled`, named by its label and described by its description. It throws `MissingContextError` outside a `Combobox` or `Autocomplete`.

`ComboboxContext.ts` and `useComboboxContext.ts` carry the list's state to its options: the active and selected values, the filter and the typed text, and the selected option's way of showing itself in the field. `Combobox`, `Autocomplete`, `ComboboxOption` and their props types are exported from `src/index.ts`; the context is not. There are no new icons.

## Behaviour

### Keys on a closed `Combobox`

- **↓, ↑, Enter or Space:** open the list with the selected option active, or the first when none is selected.
- **Alt+↓:** open the list without making any option active.
- **Home / End:** open the list with the first or last option active.
- **A printable character:** open the list and move the active option by type-ahead, with Listbox's rules from `src/collections`.
- **Any other key with Alt, Ctrl or Meta:** left to the browser and the app.

### Keys on an open `Combobox`

- **↓ / ↑:** the next or previous option, without wrapping, disabled options included. **Home / End:** the first or last option.
- **A printable character:** type-ahead, as on the closed field. Space joins a query typed within the last 500ms, as in Listbox.
- **Enter, or Space outside a type-ahead query:** commit the active option, unless it is disabled, and close the list. With no active option, close it.
- **Alt+↑:** commit the active option and close, as Enter does.
- **Escape:** close without committing.
- **Tab / Shift+Tab:** close without committing and move on.

### Keys in an `Autocomplete`

- **Typing:** changes the text, opens the list if it is closed, filters the options and makes the first match that is not disabled active. Emptying the text shows every option with none active.
- **↓:** open the list with the first option active, or move to the next option. **↑:** open it with the last option active, or move to the previous one. Neither wraps.
- **Alt+↓:** open the list without changing the active option. **Alt+↑:** commit the active option and close.
- **Enter:** commit the active option, putting its text in the input, and close. With the list closed or no option active, Enter is left to the browser, so it submits a form.
- **Escape:** with the list open, close it and keep the text. With the list closed, clear the text and the selection.
- **← / →, Home / End:** move the caret in the input, as in any text input, and leave the list as it is.
- **Tab / Shift+Tab:** close the list without committing, and move on.

### Pointer

- A click on a `Combobox` toggles its list. A click on an `Autocomplete`'s input opens its list; focus alone opens nothing, so tabbing through a form opens no lists.
- A mouse or pen moving over an option makes it active, without the focus ring, so the keys continue from there.
- A click or tap on an option commits it and closes the list, unless it is disabled. Options act on `click`, never on `pointerdown` (2.5.2), and a press on one keeps focus in the control.

### Closing and focus

- Focus leaving the control, by Tab or by a click elsewhere, closes the list without committing. An `Autocomplete` then shows the selected option's text, or none.
- Committing an option closes the list and leaves focus on the control.
- An active option that unmounts or is filtered out stops being active, so `aria-activedescendant` never names a missing or hidden option, as in Listbox.
- When no option matches the text, the list stays open and shows a muted line, the same text the live region says, in place of the options. The control's `aria-expanded` stays true.

### Placement and size

- The list opens below the field, aligned with its start edge, and flips above when there is no room below, as the menu surface does. `placement="top-start"` opens it above first.
- It is at least as wide as the field and no wider than the menu surface allows, so it reflows at 320px, and it scrolls past the surface's height. Keys scroll the active option into view, block `nearest`; the pointer never scrolls the list.

## Styling

In a new `Combobox.module.css`, beside `TextControl`'s stylesheet and the menu surface:

- **Field:** `TextControl`'s look at each size: field background, input border, radius, padding and font, with `Select`'s chevron, mirrored in right-to-left text, and the native arrow standing in for it under forced colours as `Select`'s does. A `Combobox`'s content is a row: the selected option's leading content, then its label, truncated with an ellipsis on one line. Its placeholder takes the muted colour `TextInput`'s placeholder takes.
- **Open state:** the field keeps its focus ring while the list is open, and its chevron points up.
- **List:** the menu surface, `default` density, `min-inline-size: anchor-size(width)`.
- **Options:** the menu's rows: a leading column for the check, then the option's own leading content and label with its description. Rows are at least 32px tall and 44px under `(pointer: coarse)`.
- **Active:** `--sui-menu-highlight` with `--sui-menu-on-highlight` text, read and never declared, with the menu's fallbacks; plus the inset focus ring when a key moved it there. **Disabled:** the menu's disabled look. **Selected:** `CheckIcon` in the text colour, which is the shape that shows selection (1.4.1).
- **Empty line:** `--sui-font-size-sm` muted text, padded as a row.
- **Forced colours:** the active option is `Highlight` with `HighlightText` and `forced-color-adjust: none`, as menu items are; a disabled option is `GrayText`.

These are the menu's and the text controls' existing pairings, so the Contrast stories gain nothing new. Every token read keeps a literal fallback equal to Bright's light value.

## Tech Stack

As the capability map: React 19, TypeScript 7, Vite 8, CSS modules, the Popover API and CSS anchor positioning, Vitest, Storybook 10, oxlint and oxfmt, pnpm. No new dependencies.

## Commands

```sh
pnpm verify                                                          # before every commit
pnpm test:unit src/components/Combobox/Combobox.test.tsx             # one unit test file
pnpm test:storybook src/components/Combobox/Combobox.stories.tsx     # one story file, in all four projects
pnpm build                                                           # dist/
fallow audit --format json --quiet --explain --gate-marker agent     # before every commit
```

## Project Structure

```
src/components/Combobox/            ← Combobox, Autocomplete, ComboboxOption, ComboboxContext.ts,
                                      useComboboxContext.ts, the internal hook they share, Combobox.module.css,
                                      tests, stories, index.ts
src/collections/                    ← optionId and renderedOptions, moved from Listbox
src/components/Listbox/             ← imports them from src/collections/
src/components/TextControl/         ← button as an element it renders
src/index.ts                        ← Combobox, Autocomplete, ComboboxOption and their props types
.oxlintrc.json                      ← jsx-a11y entries for Combobox (button), Autocomplete (input), ComboboxOption (div)
docs/design/concepts.md, AGENTS.md  ← a Comboboxes section and the architecture entry
```

## Code Style

Follow `docs/standards/` and the existing form controls. The two pickers the stories and docs use:

```tsx
<Field label="Assignee">
  <Combobox onValueChange={setAssignee} placeholder="Unassigned" value={assignee}>
    {people.map((person) => (
      <ComboboxOption
        description={person.team}
        key={person.id}
        leading={<Avatar name={person.name} size="sm" src={person.photo} />}
        value={person.id}
      >
        {person.name}
      </ComboboxOption>
    ))}
  </Combobox>
</Field>

<Field description="Type to search" label="Country">
  <Autocomplete name="country" onValueChange={setCountry} value={country}>
    {countries.map((country) => (
      <ComboboxOption key={country.code} value={country.code}>
        {country.name}
      </ComboboxOption>
    ))}
  </Autocomplete>
</Field>
```

A server-filtered list takes `filter={null}` and the typed text:

```tsx
<Autocomplete filter={null} inputValue={query} onInputValueChange={setQuery} onValueChange={setPerson} value={person}>
  {results.map((person) => (
    <ComboboxOption key={person.id} value={person.id}>
      {person.name}
    </ComboboxOption>
  ))}
</Autocomplete>
```

## Testing Strategy

- **Unit (jsdom), one test file per control plus `ComboboxOption.test.tsx`:**
  - Roles, names and states: the `combobox` role on the button and the input, `aria-haspopup`, `aria-autocomplete`, `aria-expanded`, `aria-controls` and `aria-activedescendant`; the list as a `listbox` named by the control; options with `aria-selected` and `aria-disabled`, named by their label and described by their description.
  - Every key in the three key lists, with the open state, the active option, the value and focus asserted after each, in both writing directions where a key's meaning could change.
  - Filtering: the default test ignores case and accents, a custom `filter` replaces it, `null` shows every option, and a filtered-out active option stops being active. The live region says the count once typing pauses, from `resultsLabel` when given.
  - Committing: Enter, Alt+↑, Space (`Combobox`) and a click commit and close; Tab, Escape and focus leaving don't commit; a disabled option is never committed; an `Autocomplete` puts the committed option's text in its input and restores it when focus leaves.
  - Controlled and uncontrolled `value` and `inputValue`, and `onValueChange` and `onInputValueChange` called once per change.
  - The field shows the selected option's leading content and label, or the placeholder; `name` submits the value with a form; a `Field` names, describes, disables and marks invalid and required both controls.
  - `ComboboxOption` outside a combobox throws `MissingContextError`.
  - Type-level rules through `// @ts-expect-error`: `role`, `type` and `value` on the controls, and `aria-label` on an option.
  - `Listbox`'s tests pass unchanged after `optionId` and `renderedOptions` move.
- **Stories (Chromium, all four projects), `Combobox.stories.tsx` and `Autocomplete.stories.tsx` with `a11y.test: "error"`:** the assignee picker and the country autocomplete in `Field`s, every size, right-to-left, a server-filtered list, and:
  - `KeyboardInteraction` for each: with real input, Tab reaches the field, the keys open, move, commit and close as listed, Escape and Tab leave the value alone, and focus never leaves the control. It asserts `focusRingContrast >= 3` on the focused field and on an active option.
  - `PointerInteraction`: a real click opens the list, hovering moves the active option without a ring, a click commits, and a click outside closes the list without committing.
  - `Narrow`: in a 320px frame the list is at least as wide as the field and fits the window.
  - `HoverContrast`: `textContrast` of an active option's label and description on the highlight is at least 4.5:1.
  - `ForcedColors`: under emulated forced colours the active option is `Highlight` with `HighlightText`.
- **By hand:** both controls in VoiceOver on macOS and iOS and in NVDA with Chrome, including the count announcement, and their placement in Firefox and WebKit, recorded in the pull request.

## Boundaries

- **Always:** the capability map's boundaries. Run `pnpm verify` and the fallow audit before every commit; add the three parts to the jsx-a11y map; keep docs in the same commit as their behaviour.
- **Ask first:** any change to `Listbox`'s, `Menu`'s or `TextControl`'s public behaviour while sharing code; any public prop not listed here, such as a clear button, a loading state or option groups; a new `OverlayPlacement`.
- **Never:** let moving through options commit or navigate; give an option focus; make free text the value; open a list on focus alone or on hover.

## Success Criteria

### API

1. `Combobox`, `Autocomplete`, `ComboboxOption` and their props types are exported from `src/index.ts`, and the context is not. A consumer importing only `Menu` bundles no combobox code, and one importing only `Combobox` bundles no menu JavaScript.
2. `ComboboxOption` outside a combobox throws `MissingContextError`, and the props the pattern sets fail to type-check.
3. The controls, the list and the options carry the roles, states and names in the API section, inside a `Field` and with `aria-label`.

### Keyboard and focus

4. Every key in the Behaviour section does what it says, proven by unit tests and both `KeyboardInteraction` stories with real input.
5. Focus stays in the control while the list is open, and `aria-activedescendant` only ever names a rendered, shown option.
6. Only Enter, Alt+↑, Space on a `Combobox`, a click and a tap commit; nothing else changes the value but Escape clearing a closed `Autocomplete`.
7. `focusRingContrast` of the focused field and of an active option moved there by a key is at least 3 in all four projects.

### Filtering and announcements

8. The default filter ignores case and accents, `filter` replaces it, and `null` leaves filtering to the consumer.
9. The live region announces the number of matches once typing pauses, in the words `resultsLabel` gives.

### Look and layout

10. Both fields match `TextControl` at every size, and the list is the menu surface, restyled by the menu's highlight tokens, with the selection shown by a check.
11. The list is at least as wide as the field and fits a 320px frame.
12. `HoverContrast` passes in all four projects, and under forced colours the active option is `Highlight` with `HighlightText`.

### Whole module

13. `Listbox`'s unit tests and stories pass unchanged.
14. Every story passes axe with `a11y.test: "error"` in all four projects.
15. `docs/design/concepts.md` describes comboboxes and when to choose `Select`, `Combobox`, `Autocomplete` or `Listbox`. AGENTS.md lists the three parts in its architecture and jsx-a11y sections, and every part and story has JSDoc.
16. `pnpm verify`, `pnpm build` and the fallow audit pass.

## Open Questions

1. **Two components or one.** `Combobox` (select-only) and `Autocomplete` (editable), as above, or one `Combobox` with an `editable` switch? Two are recommended: each types its props from the element it renders, and react-docgen can document them. Other libraries use other names, such as Select and Combobox, but `Select` is taken by the native control.
2. **Tab while the list is open.** Close without committing, as above, or commit the active option first, as the APG's select-only example does? Not committing is recommended, so passing over an option never chooses it.
3. **Typing makes the first match active.** As above, so Enter right after typing chooses the best match, or nothing active until ↓, as the APG's example without automatic selection does? The first is recommended: it is quicker, and a screen reader announces the match as it changes.
