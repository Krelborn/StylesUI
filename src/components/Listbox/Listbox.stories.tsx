import type { Meta, StoryObj } from "@storybook/react-vite";
import type { JSX } from "react";
import { useId, useState } from "react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import { accessibleNameArgTypes, childrenArgType } from "../../docs/argTypes";
import { withCustomProperties } from "../../layout";
import { focusRingContrast, resolvedColor, textContrast } from "../../test/colorContrast";
import { Avatar } from "../Avatar";
import { Badge } from "../Badge";
import { Box } from "../Box";
import { Button } from "../Button";
import { Counter } from "../Counter";
import { Row } from "../Row";
import { Stack } from "../Stack";
import { StatusDot } from "../StatusDot";
import { Text } from "../Text";

import { Listbox } from "./Listbox";
import { ListboxOption } from "./ListboxOption";

interface PullRequest {
  author: string;
  checks: "failing" | "passing";
  comments: number;
  draft: boolean;
  id: string;
  repository: string;
  title: string;
}

const pullRequests: readonly PullRequest[] = [
  {
    author: "Pat Lee",
    checks: "passing",
    comments: 3,
    draft: false,
    id: "42",
    repository: "acme/web",
    title: "Fix the flaky login test",
  },
  {
    author: "Sam Okafor",
    checks: "failing",
    comments: 0,
    draft: true,
    id: "57",
    repository: "acme/api",
    title: "Add rate limiting",
  },
  {
    author: "Ines Duarte",
    checks: "passing",
    comments: 12,
    draft: false,
    id: "61",
    repository: "acme/web",
    title: "Move settings into tabs",
  },
];

const repositories = Array.from({ length: 30 }, (_, index) => `acme/service-${index + 1}`);

interface PullRequestOptionProps {
  /**
   * The pull request the option stands for
   */
  pullRequest: PullRequest;
}

/**
 * One pull request as the app's row shows it, named by its title and described by its metadata
 */
function PullRequestOption({ pullRequest }: PullRequestOptionProps): JSX.Element {
  const titleId = useId();
  const metadataId = useId();

  return (
    <ListboxOption value={pullRequest.id} aria-describedby={metadataId} aria-labelledby={titleId}>
      <Row align="center" gap={2}>
        <Avatar name={pullRequest.author} size="sm" aria-hidden={true} />
        <Stack gap={1} style={{ flex: 1, minInlineSize: 0 }}>
          <Text id={titleId} weight="medium">
            {pullRequest.title}
          </Text>
          <Text id={metadataId} size="sm" tone="muted">
            {`${pullRequest.repository} #${pullRequest.id} · checks ${pullRequest.checks}${pullRequest.draft ? " · draft" : ""}`}
          </Text>
        </Stack>
        <StatusDot
          tone={pullRequest.checks === "passing" ? "success" : "danger"}
          data-testid={`checks-${pullRequest.id}`}
        />
        {pullRequest.draft && <Badge>Draft</Badge>}
        <Counter count={pullRequest.comments} hiddenSuffix="comments" />
      </Row>
    </ListboxOption>
  );
}

/**
 * A listbox whose selection lives in its parent
 */
function ControlledListbox(): JSX.Element {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <Stack gap={3}>
      <Listbox onValueChange={setSelected} value={selected} aria-label="Repositories">
        {repositories.slice(0, 4).map((repository) => (
          <ListboxOption key={repository} value={repository}>
            {repository}
          </ListboxOption>
        ))}
      </Listbox>
      <Text>{`Selected: ${selected ?? "none"}`}</Text>
    </Stack>
  );
}

/**
 * Waits for an element's running transitions to finish, so its colours are read at rest rather than on their way
 *
 * @param element the element whose transitions are awaited
 */
async function waitForTransitions(element: HTMLElement): Promise<void> {
  await Promise.all(element.getAnimations().map((animation) => animation.finished));
}

/**
 * Asserts that an option lies inside a scrolling listbox, clear of the focus ring drawn inside the listbox's edge
 *
 * @param option the option
 * @param listbox the focused listbox that scrolls it
 */
async function expectClearOfRing(option: HTMLElement, listbox: HTMLElement): Promise<void> {
  const optionBox = option.getBoundingClientRect();
  const listboxBox = listbox.getBoundingClientRect();
  const ringWidth = parseFloat(getComputedStyle(listbox).outlineWidth);

  await expect(optionBox.top).toBeGreaterThanOrEqual(listboxBox.top + ringWidth);
  await expect(optionBox.bottom).toBeLessThanOrEqual(listboxBox.bottom - ringWidth);
}

const meta = {
  title: "Data display/Listbox",
  component: Listbox,
  subcomponents: { ListboxOption },
  args: {
    "aria-label": "Repositories",
    defaultValue: "acme/service-2",
    onAction: fn(),
    onValueChange: fn(),
  },
  argTypes: {
    ...accessibleNameArgTypes,
    children: childrenArgType,
  },
  parameters: {
    a11y: { test: "error" },
  },
  render: (args) => (
    <Listbox {...args} style={{ maxInlineSize: "20rem" }}>
      {repositories.slice(0, 5).map((repository) => (
        <ListboxOption key={repository} value={repository}>
          {repository}
        </ListboxOption>
      ))}
    </Listbox>
  ),
} satisfies Meta<typeof Listbox>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Plain options. Without focus the selection is a primary tint with primary text and a bar; an unselected option is
 * tinted under the pointer. Clicking an option selects it and focuses the listbox.
 */
export const Default: Story = {
  play: async ({ args, canvas }) => {
    const selected = canvas.getByRole("option", { name: "acme/service-2" });
    const unselected = canvas.getByRole("option", { name: "acme/service-1" });

    await expect(textContrast(selected)).toBeGreaterThanOrEqual(4.5);
    await expect(getComputedStyle(selected, "::before").backgroundColor).toBe(
      resolvedColor(selected, "var(--sui-color-primary)")
    );
    await expect(textContrast(unselected, "var(--sui-color-secondary-subtle)")).toBeGreaterThanOrEqual(4.5);

    await userEvent.click(canvas.getByRole("option", { name: "acme/service-4" }));
    await expect(args.onValueChange).toHaveBeenLastCalledWith("acme/service-4");
    await expect(canvas.getByRole("listbox", { name: "Repositories" })).toHaveFocus();
  },
};

/**
 * The app's rows: an avatar, a title naming the option, muted metadata describing it, a status dot, a draft badge and
 * a comment count. Muted text and the status dot in the selected option take the selection's text colour, with and
 * without focus.
 */
export const RichOptions: Story = {
  render: () => (
    <Listbox defaultValue="42" aria-label="Needs you">
      {pullRequests.map((pullRequest) => (
        <PullRequestOption key={pullRequest.id} pullRequest={pullRequest} />
      ))}
    </Listbox>
  ),
  play: async ({ canvas }) => {
    const option = canvas.getByRole("option", { name: "Fix the flaky login test" });
    const metadata = within(option).getByText("acme/web #42 · checks passing");
    const dot = within(option).getByTestId("checks-42");
    const unselectedDot = canvas.getByTestId("checks-57");
    // Resolving a colour adds a probe element, which inside waitFor would set off its DOM observer again and again
    const primary = resolvedColor(option, "var(--sui-color-primary)");
    const onPrimary = resolvedColor(option, "var(--sui-color-on-primary)");

    await expect(option).toHaveAccessibleDescription("acme/web #42 · checks passing");
    await expect(textContrast(metadata, getComputedStyle(option).backgroundColor)).toBeGreaterThanOrEqual(4.5);
    await expect(getComputedStyle(dot).color).toBe(primary);
    await expect(getComputedStyle(unselectedDot).color).toBe(
      resolvedColor(unselectedDot, "var(--sui-color-danger-text)")
    );

    await userEvent.tab();
    await waitFor(() => {
      expect(getComputedStyle(option).backgroundColor).toBe(primary);
      expect(getComputedStyle(dot).color).toBe(onPrimary);
    });
    await expect(textContrast(metadata, getComputedStyle(option).backgroundColor)).toBeGreaterThanOrEqual(4.5);
  },
};

/**
 * In a scrolling listbox, a keyboard move scrolls the active option into view clear of the focus ring, without
 * scrolling the page. Entering with nothing selected rings the first option without selecting it.
 */
export const Scrolling: Story = {
  render: (args) => (
    <Listbox
      {...args}
      defaultValue={undefined}
      style={{ maxBlockSize: "12rem", maxInlineSize: "20rem", overflowY: "auto" }}
    >
      {repositories.map((repository) => (
        <ListboxOption key={repository} value={repository}>
          {repository}
        </ListboxOption>
      ))}
    </Listbox>
  ),
  play: async ({ canvas }) => {
    const listbox = canvas.getByRole("listbox", { name: "Repositories" });
    const first = canvas.getByRole("option", { name: "acme/service-1" });
    const pageScroll = window.scrollY;

    await userEvent.tab();
    await expect(first).toHaveAttribute("aria-selected", "false");
    await expect(focusRingContrast(first)).toBeGreaterThanOrEqual(3);

    await userEvent.keyboard("{ArrowDown}".repeat(8));
    await waitFor(() => expectClearOfRing(canvas.getByRole("option", { name: "acme/service-9" }), listbox));

    await userEvent.keyboard("{End}");
    await waitFor(() => expectClearOfRing(canvas.getByRole("option", { name: "acme/service-30" }), listbox));

    await userEvent.keyboard("{ArrowUp}".repeat(8));
    await waitFor(() => expectClearOfRing(canvas.getByRole("option", { name: "acme/service-22" }), listbox));
    await expect(window.scrollY).toBe(pageScroll);
  },
};

/**
 * A disabled option is dimmed and never selected, but the arrow keys reach it so it is read. Its focus ring keeps its
 * full colour.
 */
export const Disabled: Story = {
  render: (args) => (
    <Listbox {...args} defaultValue="acme/service-1">
      <ListboxOption value="acme/service-1">acme/service-1</ListboxOption>
      <ListboxOption disabled={true} value="acme/service-2">
        acme/service-2 <Badge>Archived</Badge>
      </ListboxOption>
      <ListboxOption value="acme/service-3">acme/service-3</ListboxOption>
    </Listbox>
  ),
  play: async ({ canvas }) => {
    const listbox = canvas.getByRole("listbox", { name: "Repositories" });
    const disabled = canvas.getByRole("option", { name: "acme/service-2 Archived" });

    await userEvent.tab();
    await userEvent.keyboard("{ArrowDown}");
    await expect(listbox).toHaveAttribute("aria-activedescendant", disabled.id);
    await expect(listbox.matches(":focus-visible")).toBe(true);
    await expect(disabled).toHaveAttribute("aria-selected", "false");
    await expect(getComputedStyle(disabled).color).toBe(
      resolvedColor(disabled, "color-mix(in srgb, var(--sui-color-text) 50%, transparent)")
    );
    await expect(getComputedStyle(within(disabled).getByText("Archived")).opacity).toBe("0.5");
    await expect(getComputedStyle(disabled).opacity).toBe("1");
    await expect(focusRingContrast(disabled)).toBeGreaterThanOrEqual(3);
  },
};

/**
 * `value` makes the listbox controlled: the selection is whatever the parent passes. `null` selects nothing.
 */
export const Controlled: Story = {
  render: () => <ControlledListbox />,
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("option", { name: "acme/service-3" }));
    await expect(canvas.getByText("Selected: acme/service-3")).toBeInTheDocument();
  },
};

/**
 * An app that greys the selection while its window is inactive sets the focused selection tokens to the inactive
 * ones, here on a wrapper standing in for the window
 */
export const InactiveWindow: Story = {
  render: (args) => (
    <Box
      style={withCustomProperties(
        {
          "--sui-listbox-on-selection": "var(--sui-color-primary)",
          "--sui-listbox-selection": "var(--sui-color-primary-subtle)",
        },
        undefined
      )}
      data-window-focused="false"
    >
      <Listbox {...args}>
        {repositories.slice(0, 3).map((repository) => (
          <ListboxOption key={repository} value={repository}>
            {repository}
          </ListboxOption>
        ))}
      </Listbox>
    </Box>
  ),
  play: async ({ canvas }) => {
    const selected = canvas.getByRole("option", { name: "acme/service-2" });
    const unfocusedBackground = getComputedStyle(selected).backgroundColor;

    await userEvent.tab();
    await waitForTransitions(selected);
    await expect(getComputedStyle(selected).backgroundColor).toBe(unfocusedBackground);
    await expect(textContrast(selected)).toBeGreaterThanOrEqual(4.5);
  },
};

/**
 * Tab enters the listbox, which draws its focus ring inside its edge. The arrow keys move the selection, Enter calls
 * `onAction`, and the selection keeps 4.5:1 text contrast with and without focus.
 */
export const KeyboardInteraction: Story = {
  render: (args) => (
    <Stack gap={4}>
      <Listbox {...args} style={{ maxInlineSize: "20rem" }}>
        {repositories.slice(0, 5).map((repository) => (
          <ListboxOption key={repository} value={repository}>
            {repository}
          </ListboxOption>
        ))}
      </Listbox>
      <Button>After the list</Button>
    </Stack>
  ),
  play: async ({ args, canvas }) => {
    const listbox = canvas.getByRole("listbox", { name: "Repositories" });

    await userEvent.tab();
    await expect(listbox).toHaveFocus();
    await expect(listbox.matches(":focus-visible")).toBe(true);
    await expect(focusRingContrast(listbox)).toBeGreaterThanOrEqual(3);

    await userEvent.keyboard("{ArrowDown}");
    const third = canvas.getByRole("option", { name: "acme/service-3" });
    await expect(third).toHaveAttribute("aria-selected", "true");
    await waitForTransitions(third);
    await expect(textContrast(third)).toBeGreaterThanOrEqual(4.5);

    await userEvent.keyboard("{Enter}");
    await expect(args.onAction).toHaveBeenCalledWith("acme/service-3");

    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "After the list" })).toHaveFocus();
    await waitForTransitions(third);
    await expect(textContrast(third)).toBeGreaterThanOrEqual(4.5);
  },
};
