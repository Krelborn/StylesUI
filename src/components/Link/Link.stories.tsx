import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentPropsWithRef, JSX, MouseEvent } from "react";
import { expect, fn, userEvent } from "storybook/test";

import { childrenArgType } from "../../docs/argTypes";
import { focusRingContrast } from "../../test/colorContrast";
import { Box } from "../Box";
import { Cluster } from "../Cluster";
import { Stack } from "../Stack";
import { Text } from "../Text";

import { Link } from "./Link";

interface RouterLinkProps extends Omit<ComponentPropsWithRef<"a">, "href"> {
  /**
   * Route to navigate to, in place of `href`
   */
  to: string;
}

/**
 * Stand-in for a hash router's link: takes a route and renders the anchor for it itself
 */
function RouterLink({ children, to, ...rest }: RouterLinkProps): JSX.Element {
  return (
    <Box {...rest} as="a" href={`#${to}`}>
      {children}
    </Box>
  );
}

function fontWeight(element: HTMLElement): number {
  return Number(getComputedStyle(element).fontWeight);
}

const meta = {
  title: "Navigation/Link",
  component: Link,
  args: {
    children: "Release notes",
    href: "#main",
  },
  argTypes: {
    as: {
      control: false,
      description:
        "What to render: `a`, or a component that renders an anchor, such as a router's link. `Link` accepts every prop of the anchor or component, and the component must pass the `className` and `data-*` attributes it is given on to its anchor.",
      table: {
        defaultValue: { summary: "a" },
        type: { summary: '"a" | JSXElementConstructor' },
      },
    },
    children: childrenArgType,
    href: {
      control: "text",
      description: "Where the link goes. A component given in `as` takes its own destination prop instead.",
      table: { type: { summary: "string" } },
    },
  },
  parameters: {
    a11y: { test: "error" },
  },
} satisfies Meta<typeof Link>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * A link in the theme's link colour, underlined so it does not rely on colour alone
 */
export const Default: Story = {};

/**
 * `primary` is the theme's link colour. `inherit` takes the colour of the text around it, here
 * muted text, and is told apart by its underline.
 */
export const Tones: Story = {
  render: () => (
    <Stack>
      <Text as="p">
        Read the <Link href="#main">installation guide</Link> before you start.
      </Text>
      <Text as="p" tone="muted">
        Filed under{" "}
        <Link href="#main" tone="inherit">
          design systems
        </Link>{" "}
        last week.
      </Text>
    </Stack>
  ),
  play: async ({ canvas }) => {
    const inheritLink = canvas.getByRole("link", { name: "design systems" });
    const surroundingText = canvas.getByText("Filed under", { exact: false });

    await expect(getComputedStyle(inheritLink).color).toBe(getComputedStyle(surroundingText).color);
  },
};

/**
 * `underline="hover"` shows the underline on hover and keyboard focus only. It is for navigation,
 * where position marks the links out; in running text a link needs its underline.
 */
export const UnderlineOnHover: Story = {
  render: () => (
    <Cluster as="nav" gap={4} aria-label="Main">
      <Link href="#overview" underline="hover">
        Overview
      </Link>
      <Link href="#components" underline="hover">
        Components
      </Link>
      <Link href="#changelog" underline="hover">
        Changelog
      </Link>
    </Cluster>
  ),
  play: async ({ canvas }) => {
    const overview = canvas.getByRole("link", { name: "Overview" });

    await expect(getComputedStyle(overview).textDecorationLine).toBe("none");

    await userEvent.tab();
    await expect(overview).toHaveFocus();
    await expect(getComputedStyle(overview).textDecorationLine).toBe("underline");
  },
};

/**
 * `aria-current` marks the link to the current page, which is shown in the bold weight
 */
export const CurrentPage: Story = {
  render: () => (
    <Cluster as="nav" gap={4} aria-label="Main">
      <Link href="#overview" underline="hover">
        Overview
      </Link>
      <Link href="#components" underline="hover" aria-current="page">
        Components
      </Link>
      <Link href="#changelog" underline="hover">
        Changelog
      </Link>
    </Cluster>
  ),
  play: async ({ canvas }) => {
    const overview = canvas.getByRole("link", { name: "Overview" });
    const components = canvas.getByRole("link", { current: "page", name: "Components" });

    await expect(fontWeight(components)).toBeGreaterThan(fontWeight(overview));
  },
};

/**
 * `as` takes a component that renders an anchor, such as a router's link. `Link` then accepts that
 * component's props, here `to` in place of `href`, and styles the anchor it renders.
 */
export const AsComponent: Story = {
  render: () => (
    // oxlint-disable-next-line jsx-a11y/anchor-is-valid -- to is the destination, in place of href
    <Link as={RouterLink} to="/settings">
      Account settings
    </Link>
  ),
  play: async ({ canvas }) => {
    const link = canvas.getByRole("link", { name: "Account settings" });

    await expect(link).toHaveAttribute("href", "#/settings");
    await expect(getComputedStyle(link).textDecorationLine).toBe("underline");
  },
};

/**
 * Tab moves focus through the links in order and shows a focus ring, and Enter follows the focused
 * link. `aria-current="false"` is not styled as the current page.
 */
export const KeyboardInteraction: Story = {
  args: {
    // Following the link would navigate the page away from the story
    onClick: fn((event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
    }),
  },
  render: (args) => (
    <Cluster as="nav" gap={4} aria-label="Main">
      <Link {...args} href="#overview">
        Overview
      </Link>
      <Link href="#components" aria-current="page">
        Components
      </Link>
      <Link href="#changelog" aria-current="false">
        Changelog
      </Link>
    </Cluster>
  ),
  play: async ({ args, canvas }) => {
    const overview = canvas.getByRole("link", { name: "Overview" });
    const components = canvas.getByRole("link", { name: "Components" });
    const changelog = canvas.getByRole("link", { name: "Changelog" });

    await userEvent.tab();
    await expect(overview).toHaveFocus();
    await expect(overview.matches(":focus-visible")).toBe(true);
    await expect(parseFloat(getComputedStyle(overview).outlineWidth)).toBeGreaterThanOrEqual(2);
    await expect(focusRingContrast(overview)).toBeGreaterThanOrEqual(3);

    await userEvent.keyboard("{Enter}");
    await expect(args.onClick).toHaveBeenCalledOnce();

    await userEvent.tab();
    await expect(components).toHaveFocus();

    await userEvent.tab();
    await expect(changelog).toHaveFocus();

    await userEvent.tab({ shift: true });
    await expect(components).toHaveFocus();

    await expect(fontWeight(components)).toBeGreaterThan(fontWeight(overview));
    await expect(fontWeight(changelog)).toBe(fontWeight(overview));
  },
};
