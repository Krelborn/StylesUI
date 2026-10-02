import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";

import { childrenArgType } from "../../docs/argTypes";
import { focusRingContrast, textContrast } from "../../test/colorContrast";
import { Box } from "../Box";
import { Link } from "../Link";
import { Stack } from "../Stack";

import type { AlertTone } from "./Alert";
import { Alert } from "./Alert";

interface ToneExample {
  body: string;
  title: string;
  tone: AlertTone;
}

const toneExamples: ToneExample[] = [
  {
    body: "The export runs in the background, so you can keep working.",
    title: "Export started",
    tone: "info",
  },
  {
    body: "Your changes are live for everyone on the team.",
    title: "Settings saved",
    tone: "success",
  },
  {
    body: "Your plan has room for five more invitations this month.",
    title: "Approaching the limit",
    tone: "warning",
  },
  {
    body: "The card was declined. Check the details and try again.",
    title: "Payment failed",
    tone: "danger",
  },
];

const unbrokenTitle = "Supercalifragilisticexpialidocious";
const unbrokenWord = "Pneumonoultramicroscopicsilicovolcanoconiosis";

function fontWeight(element: HTMLElement): number {
  return Number(getComputedStyle(element).fontWeight);
}

const meta = {
  title: "Feedback/Alert",
  component: Alert,
  argTypes: {
    children: childrenArgType,
  },
  parameters: {
    a11y: { test: "error" },
  },
} satisfies Meta<typeof Alert>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Every tone with the icon that goes with it. Each shows its meaning in the icon and the title as
 * well as in colour, and the title and text meet the 4.5:1 contrast ratio on the tinted background.
 */
export const Tones: Story = {
  render: () => (
    <Stack>
      {toneExamples.map(({ body, title, tone }) => (
        <Alert key={tone} title={title} tone={tone}>
          {body}
        </Alert>
      ))}
    </Stack>
  ),
  play: async ({ canvas, canvasElement }) => {
    for (const { body, title } of toneExamples) {
      await expect(textContrast(canvas.getByText(title))).toBeGreaterThanOrEqual(4.5);
      await expect(textContrast(canvas.getByText(body))).toBeGreaterThanOrEqual(4.5);
    }

    const icons = canvasElement.querySelectorAll("svg");
    await expect(icons).toHaveLength(toneExamples.length);

    for (const icon of icons) {
      const { height, width } = icon.getBoundingClientRect();
      await expect(width).toBeGreaterThanOrEqual(16);
      await expect(height).toBe(width);
    }
  },
};

/**
 * `title` is a bold first line above the children. It is a line of text rather than a heading, so
 * it does not add to the page's heading outline, and it is never set as the native `title`
 * attribute.
 */
export const WithTitle: Story = {
  args: {
    children: "The dashboard is read-only on Saturday from 02:00 to 03:00 UTC.",
    title: "Scheduled maintenance",
    tone: "warning",
  },
  play: async ({ canvas }) => {
    const title = canvas.getByText("Scheduled maintenance");
    const body = canvas.getByText("The dashboard is read-only on Saturday from 02:00 to 03:00 UTC.");

    await expect(fontWeight(title)).toBeGreaterThanOrEqual(600);
    await expect(fontWeight(title)).toBeGreaterThan(fontWeight(body));
    await expect(canvas.queryByRole("heading")).not.toBeInTheDocument();
    await expect(canvas.queryByTitle("Scheduled maintenance")).not.toBeInTheDocument();
  },
};

/**
 * A `Link` inside an alert takes the alert's text colour, and its underline tells it apart from the
 * text around it. Its text and focus ring keep their contrast on the tinted background.
 */
export const WithLink: Story = {
  render: () => (
    <Alert title="Scheduled maintenance" tone="warning">
      The dashboard is read-only on Saturday from 02:00 to 03:00 UTC. Follow the{" "}
      <Link href="#status">maintenance schedule</Link> for updates.
    </Alert>
  ),
  play: async ({ canvas }) => {
    const link = canvas.getByRole("link", { name: "maintenance schedule" });
    const body = canvas.getByText("The dashboard is read-only", { exact: false });

    await expect(getComputedStyle(link).color).toBe(getComputedStyle(body).color);
    await expect(getComputedStyle(link).textDecorationLine).toBe("underline");
    await expect(textContrast(link)).toBeGreaterThanOrEqual(4.5);

    await userEvent.tab();
    await expect(link).toHaveFocus();
    await expect(link.matches(":focus-visible")).toBe(true);
    await expect(parseFloat(getComputedStyle(link).outlineWidth)).toBeGreaterThanOrEqual(2);
    await expect(focusRingContrast(link)).toBeGreaterThanOrEqual(3);
  },
};

/**
 * `icon` replaces the icon for the tone with any node, which is drawn in the alert's accent colour
 * when it uses `currentColor`. `null` or `false` shows no icon.
 */
export const CustomIcon: Story = {
  render: () => (
    <Stack>
      <Alert
        icon={
          <Box as="svg" fill="currentColor" height="1.25em" viewBox="0 0 24 24" width="1.25em" aria-hidden="true">
            <Box as="polygon" points="12,2 15.1,8.6 22,9.3 16.8,14 18.2,21 12,17.5 5.8,21 7.2,14 2,9.3 8.9,8.6" />
          </Box>
        }
        title="Dark mode is here"
      >
        Switch themes from the menu in the page header.
      </Alert>
      <Alert icon={null} tone="success">
        Your changes are saved.
      </Alert>
    </Stack>
  ),
  play: async ({ canvas, canvasElement }) => {
    const icons = canvasElement.querySelectorAll("svg");
    await expect(icons).toHaveLength(1);
    await expect(getComputedStyle(icons[0]).color).toBe(getComputedStyle(canvas.getByText("Dark mode is here")).color);
    await expect(canvas.getByText("Your changes are saved.")).toBeInTheDocument();
  },
};

/**
 * An alert has no role, so a screen reader reads it in place. For an error raised by an action,
 * such as a submitted form, set `role="alert"` so it is announced straight away. For a quiet
 * update that is not urgent, set `aria-live="polite"` instead:
 *
 * ```tsx
 * <Alert tone="success" aria-live="polite">Draft saved</Alert>
 * ```
 */
export const AsErrorSummary: Story = {
  render: () => (
    <Alert role="alert" title="There are 2 problems with your submission" tone="danger">
      <Stack as="ul" gap={1}>
        <Box as="li">
          <Link href="#email">Enter an email address in the format name@example.com</Link>
        </Box>
        <Box as="li">
          <Link href="#password">Choose a password of at least 12 characters</Link>
        </Box>
      </Stack>
    </Alert>
  ),
  play: async ({ canvas }) => {
    const alert = canvas.getByRole("alert");

    await expect(alert).toHaveTextContent("There are 2 problems with your submission");
    await expect(within(alert).getAllByRole("link")).toHaveLength(2);
  },
};

/**
 * Text with no space to break at wraps inside the alert instead of pushing it wider than its
 * container, in the title as well as the body
 */
export const LongText: Story = {
  render: () => (
    <Box style={{ inlineSize: "16rem" }} data-testid="narrow-column">
      <Alert title={unbrokenTitle} tone="danger" data-testid="long-text-alert">
        {unbrokenWord}
      </Alert>
    </Box>
  ),
  play: async ({ canvas }) => {
    const column = canvas.getByTestId("narrow-column");
    const alert = canvas.getByTestId("long-text-alert");
    const title = canvas.getByText(unbrokenTitle);
    const body = canvas.getByText(unbrokenWord);

    await expect(alert.getBoundingClientRect().width).toBeLessThanOrEqual(column.getBoundingClientRect().width);
    await expect(alert.scrollWidth).toBeLessThanOrEqual(alert.clientWidth);
    await expect(title.scrollWidth).toBeLessThanOrEqual(title.clientWidth);
    await expect(body.scrollWidth).toBeLessThanOrEqual(body.clientWidth);
  },
};
