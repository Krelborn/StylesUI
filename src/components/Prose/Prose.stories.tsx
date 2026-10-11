import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties, JSX } from "react";
import { expect, userEvent, waitFor } from "storybook/test";

import { asArgType } from "../../docs/argTypes";
import { focusRingContrast, resolvedColor } from "../../test/colorContrast";
import { trustedInput } from "../../test/trustedInput";
import { Badge } from "../Badge";
import { Box } from "../Box";
import { Button } from "../Button";
import type { CardProps } from "../Card";
import { Card } from "../Card";
import { Heading } from "../Heading";
import { Stack } from "../Stack";
import { Text } from "../Text";

import type { ProseSize } from "./Prose";
import { Prose } from "./Prose";

interface SizeExample {
  size: ProseSize;
  text: string;
}

const sizeExamples: SizeExample[] = [
  { size: "sm", text: "Small prose suits dense pages such as a changelog." },
  { size: "md", text: "Medium prose is the default, for most articles." },
  { size: "lg", text: "Large prose suits a long read in a narrow column." },
];

const introduction =
  "Prose styles the raw elements that markdown and a CMS produce, so an article reads well without a component for every element.";

const figureImage = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400"><rect width="1200" height="400" fill="#0f766e"/><circle cx="600" cy="200" r="120" fill="#99f6e4"/></svg>'
)}`;

const longUrl =
  "https://example.com/reports/2026/quarterly-results/by-region/europe-middle-east-and-africa/consolidated-summary.html";

const wideCodeLine =
  'const response = await fetch("https://api.example.com/v2/organisations/acme/projects/website/deployments?status=failed");';

const longReadText =
  "A column wide enough for ninety characters a line reads more easily with a little more space between its lines, so the eye finds the start of the next one.";

const textDiagram = ["┌────────┐     ┌────────┐", "│ Editor │ ──▶ │ Server │", "└────────┘     └────────┘"].join("\n");

const quarterColumns = [
  "Region",
  "First quarter",
  "Second quarter",
  "Third quarter",
  "Fourth quarter",
  "Change on last year",
];

const quarterRows = [
  ["Europe", "€1.2m", "€1.4m", "€1.3m", "€1.6m", "+12%"],
  ["North America", "$2.1m", "$2.0m", "$2.4m", "$2.7m", "+9%"],
  ["Asia Pacific", "$0.8m", "$0.9m", "$1.1m", "$1.2m", "+21%"],
];

const releaseCardHeading = "Hear about the next release";
const releaseCardText = "One email when a version ships, and nothing else.";

/**
 * A card of StylesUI components, shown outside prose and inside it to compare the two
 */
function ReleaseCard(props: CardProps): JSX.Element {
  return (
    <Card {...props}>
      <Stack align="start" gap={3}>
        <Badge as="a" href="#changelog" tone="success">
          Changelog
        </Badge>
        <Heading level={3}>{releaseCardHeading}</Heading>
        <Text as="p" tone="muted">
          {releaseCardText}
        </Text>
        <Button>Subscribe</Button>
      </Stack>
    </Card>
  );
}

function blockStartMargin(element: HTMLElement): number {
  return parseFloat(getComputedStyle(element).marginBlockStart);
}

function fontSize(element: HTMLElement): number {
  return parseFloat(getComputedStyle(element).fontSize);
}

function lineHeightRatio(element: HTMLElement): number {
  return parseFloat(getComputedStyle(element).lineHeight) / fontSize(element);
}

const meta = {
  title: "Typography/Prose",
  component: Prose,
  argTypes: {
    as: asArgType("div", ["div", "article", "section"]),
  },
  parameters: {
    a11y: { test: "error" },
  },
} satisfies Meta<typeof Prose>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * A full article written as raw elements. Blocks are spaced apart with more room above a heading
 * and none above the first element, and a link is underlined and shows a focus ring.
 */
export const Default: Story = {
  render: (args) => (
    <Prose {...args}>
      <h1>Styling rendered markdown</h1>
      <p>{introduction}</p>
      <h2>Text</h2>
      <p>
        A paragraph can hold a link to <a href="#lists">the lists section</a>, <strong>strong</strong> and{" "}
        <em>emphasised</em> text, <code>inline code</code> and keys such as <kbd>Ctrl</kbd> + <kbd>S</kbd>.
      </p>
      <blockquote>
        <p>A quote is set in muted text beside a border.</p>
      </blockquote>
      <h2 id="lists">Lists</h2>
      <ul>
        <li>A bulleted list keeps its markers</li>
        <li>
          A nested list is indented
          <ul>
            <li>and takes the next marker</li>
          </ul>
        </li>
      </ul>
      <ol>
        <li>Install the package</li>
        <li>Import the stylesheet</li>
        <li>Wrap the content in prose</li>
      </ol>
      <hr />
      <h2>Code and media</h2>
      <h3>Code blocks</h3>
      <pre>
        <code>{"pnpm add @krelborn/stylesui\npnpm typecheck"}</code>
      </pre>
      <h3>Figures</h3>
      <figure>
        <img alt="Pale teal circle on a dark teal background" height={400} src={figureImage} width={1200} />
        <figcaption>A caption is set in small, muted text, and the image never outgrows the column.</figcaption>
      </figure>
      <h3>Tables</h3>
      <table>
        <thead>
          <tr>
            <th scope="col">Browser</th>
            <th scope="col">Minimum version</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Chrome</td>
            <td>123</td>
          </tr>
          <tr>
            <td>Firefox</td>
            <td>120</td>
          </tr>
          <tr>
            <td>Safari</td>
            <td>17.5</td>
          </tr>
        </tbody>
      </table>
    </Prose>
  ),
  play: async ({ canvas }) => {
    const title = canvas.getByRole("heading", { level: 1 });
    const paragraph = canvas.getByText(introduction);
    const sectionHeading = canvas.getByRole("heading", { level: 2, name: "Text" });
    const link = canvas.getByRole("link", { name: "the lists section" });

    await expect(blockStartMargin(title)).toBe(0);
    await expect(blockStartMargin(paragraph)).toBeGreaterThan(0);
    await expect(blockStartMargin(sectionHeading)).toBeGreaterThan(blockStartMargin(paragraph));
    await expect(fontSize(title)).toBeGreaterThan(fontSize(sectionHeading));

    await expect(getComputedStyle(link).textDecorationLine).toBe("underline");

    await userEvent.tab();
    await expect(link).toHaveFocus();
    await expect(link.matches(":focus-visible")).toBe(true);
    await expect(parseFloat(getComputedStyle(link).outlineWidth)).toBeGreaterThanOrEqual(2);
    await expect(focusRingContrast(link)).toBeGreaterThanOrEqual(3);
  },
};

/**
 * `size` sets the size of the body text. Headings keep the size of their level.
 */
export const Sizes: Story = {
  render: () => (
    <Stack gap={6}>
      {sizeExamples.map(({ size, text }) => (
        <Prose key={size} size={size}>
          <h3>Release notes</h3>
          <p>{text}</p>
        </Prose>
      ))}
    </Stack>
  ),
  play: async ({ canvas }) => {
    const [small, medium, large] = sizeExamples.map(({ text }) => fontSize(canvas.getByText(text)));

    await expect(small).toBeLessThan(medium);
    await expect(medium).toBeLessThan(large);
  },
};

/**
 * `--sui-prose-line-height`, set on the prose or an ancestor, spaces out the lines of text for a
 * column long enough to need it. Here an ancestor sets it. Code keeps `--sui-line-height-normal`, so
 * a diagram drawn in text keeps its shape.
 */
export const LineHeight: Story = {
  render: (args) => (
    <Box style={{ "--sui-prose-line-height": 1.6 } as CSSProperties}>
      <Prose {...args}>
        <p>{longReadText}</p>
        <pre data-testid="line-height-code">
          <code>{textDiagram}</code>
        </pre>
      </Prose>
    </Box>
  ),
  play: async ({ canvas }) => {
    const paragraph = canvas.getByText(longReadText);
    const codeBlock = canvas.getByTestId("line-height-code");
    const normalLineHeight = parseFloat(getComputedStyle(codeBlock).getPropertyValue("--sui-line-height-normal"));

    await expect(lineHeightRatio(paragraph)).toBeCloseTo(1.6);
    await expect(lineHeightRatio(codeBlock)).toBeCloseTo(normalLineHeight);
  },
};

/**
 * A StylesUI component inside prose keeps its own styles. The same card is shown above the prose
 * and inside it, and its `Badge` link, `Heading`, `Text` paragraph and `Button` look the same and
 * sit the same distance apart in both. Prose spaces only the raw elements it styles, so the card
 * inside it sets its own margin from `--sui-prose-flow`.
 */
export const WithComponents: Story = {
  render: (args) => (
    <Stack gap={6}>
      <ReleaseCard />
      <Prose {...args}>
        <h2 id="changelog">Changelog</h2>
        <p>Version 2 adds form controls and feedback components.</p>
        <ReleaseCard style={{ marginBlockStart: "var(--sui-prose-flow)" }} />
      </Prose>
    </Stack>
  ),
  play: async ({ canvas }) => {
    const [outsideBadge, insideBadge] = canvas.getAllByRole("link", { name: "Changelog" });
    const [outsideHeading, insideHeading] = canvas.getAllByRole("heading", { name: releaseCardHeading });
    const [outsideText, insideText] = canvas.getAllByText(releaseCardText);
    const [outsideButton, insideButton] = canvas.getAllByRole("button", { name: "Subscribe" });

    await expect(getComputedStyle(insideBadge).textDecorationLine).toBe(
      getComputedStyle(outsideBadge).textDecorationLine
    );
    await expect(getComputedStyle(insideBadge).color).toBe(getComputedStyle(outsideBadge).color);
    await expect(blockStartMargin(insideHeading)).toBe(blockStartMargin(outsideHeading));
    await expect(blockStartMargin(insideText)).toBe(blockStartMargin(outsideText));
    await expect(getComputedStyle(insideButton).color).toBe(getComputedStyle(outsideButton).color);
  },
};

/**
 * A long URL and a wide line of code wrap inside a narrow column instead of pushing the prose wider
 * than its container, in a paragraph, a code block and a list item. By default a code block wraps
 * rather than scrolls, so it needs no keyboard focus.
 */
export const LongContent: Story = {
  render: (args) => (
    <Box style={{ inlineSize: "18rem" }}>
      <Prose {...args} data-testid="long-content-prose">
        <h2 id="quarterly-report">Quarterly report</h2>
        <p>
          The report is published at <a href="#quarterly-report">{longUrl}</a> each quarter.
        </p>
        <pre>
          <code>{wideCodeLine}</code>
        </pre>
        <ul>
          <li>Mirror: {longUrl}</li>
        </ul>
      </Prose>
    </Box>
  ),
  play: async ({ canvas }) => {
    const prose = canvas.getByTestId("long-content-prose");

    await expect(prose.scrollWidth).toBeLessThanOrEqual(prose.clientWidth);
  },
};

/**
 * Header cells sit on the sunken colour. A table is as wide as its content, and one wider than the
 * column scrolls sideways inside its own box rather than pushing the prose wider. A table that
 * scrolls takes `tabIndex={0}`, so a keyboard can reach and scroll it, and shows a focus ring.
 */
export const Tables: Story = {
  render: (args) => (
    <Box style={{ inlineSize: "24rem" }}>
      <Prose {...args} data-testid="tables-prose">
        <table>
          <thead>
            <tr>
              <th scope="col">Size</th>
              <th scope="col">Body text</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>sm</td>
              <td>0.875rem</td>
            </tr>
            <tr>
              <td>md</td>
              <td>1rem</td>
            </tr>
            <tr>
              <td>lg</td>
              <td>1.125rem</td>
            </tr>
          </tbody>
        </table>
        {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a table that scrolls needs focus for a keyboard to scroll it */}
        <table tabIndex={0}>
          <thead>
            <tr>
              {quarterColumns.map((column) => (
                <th key={column} scope="col">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {quarterRows.map(([region, ...cells]) => (
              <tr key={region}>
                <th scope="row">{region}</th>
                {cells.map((cell, index) => (
                  <td key={quarterColumns[index + 1]}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Prose>
    </Box>
  ),
  play: async ({ canvas }) => {
    const prose = canvas.getByTestId("tables-prose");
    const [narrowTable, wideTable] = canvas.getAllByRole("table");
    const [header] = canvas.getAllByRole("columnheader");

    await expect(getComputedStyle(header).backgroundColor).toBe(resolvedColor(header, "var(--sui-color-sunken)"));
    await expect(narrowTable.clientWidth).toBeLessThan(prose.clientWidth);
    await expect(narrowTable.scrollWidth).toBe(narrowTable.clientWidth);
    await expect(wideTable.scrollWidth).toBeGreaterThan(wideTable.clientWidth);
    await expect(prose.scrollWidth).toBeLessThanOrEqual(prose.clientWidth);

    await userEvent.tab();
    await expect(wideTable).toHaveFocus();
    await expect(wideTable.matches(":focus-visible")).toBe(true);
    await expect(focusRingContrast(wideTable)).toBeGreaterThanOrEqual(3);

    const input = trustedInput();

    if (input === null) {
      return;
    }

    await input.pressKey("ArrowRight");
    await waitFor(() => expect(wideTable.scrollLeft).toBeGreaterThan(0));
  },
};

/**
 * With `codeOverflow="scroll"`, a code block keeps each line whole, so indentation and diagrams
 * drawn in text keep their shape, and one wider than the column scrolls sideways inside its own box.
 * A code block that scrolls takes `tabIndex={0}`, so a keyboard can reach and scroll it, and shows a
 * focus ring, as a table does.
 */
export const ScrollingCode: Story = {
  args: {
    codeOverflow: "scroll",
  },
  render: (args) => (
    <Box style={{ inlineSize: "24rem" }}>
      <Prose {...args} data-testid="scrolling-code-prose">
        <pre data-testid="short-code">
          <code>pnpm add @krelborn/stylesui</code>
        </pre>
        {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a code block that scrolls needs focus for a keyboard to scroll it */}
        <pre tabIndex={0} data-testid="wide-code">
          <code>{wideCodeLine}</code>
        </pre>
      </Prose>
    </Box>
  ),
  play: async ({ canvas }) => {
    // After the Tables story's trusted press, focus from userEvent.tab() only matches :focus-visible once a trusted key
    // has been pressed
    await trustedInput()?.pressKey("Shift");
    const prose = canvas.getByTestId("scrolling-code-prose");
    const shortCode = canvas.getByTestId("short-code");
    const wideCode = canvas.getByTestId("wide-code");

    await expect(shortCode.scrollWidth).toBe(shortCode.clientWidth);
    await expect(wideCode.scrollWidth).toBeGreaterThan(wideCode.clientWidth);
    await expect(canvas.getByText(wideCodeLine).getClientRects()).toHaveLength(1);
    await expect(prose.scrollWidth).toBeLessThanOrEqual(prose.clientWidth);

    await userEvent.tab();
    await expect(wideCode).toHaveFocus();
    await expect(wideCode.matches(":focus-visible")).toBe(true);
    await expect(focusRingContrast(wideCode)).toBeGreaterThanOrEqual(3);

    const input = trustedInput();

    if (input === null) {
      return;
    }

    await input.pressKey("ArrowRight");
    await waitFor(() => expect(wideCode.scrollLeft).toBeGreaterThan(0));
  },
};
