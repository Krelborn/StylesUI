import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, waitFor, within } from "storybook/test";

import { textContrast } from "../../test/colorContrast";
import { Cluster } from "../Cluster";
import { Row } from "../Row";
import { Text } from "../Text";

import type { AvatarSize } from "./Avatar";
import { Avatar } from "./Avatar";

const sizes: AvatarSize[] = ["xs", "sm", "md", "lg"];

const sizeRems: Record<AvatarSize, number> = {
  lg: 3,
  md: 2,
  sm: 1.5,
  xs: 1,
};

const portrait = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="#0f766e"/><circle cx="5" cy="4" r="2" fill="#99f6e4"/><rect x="2" y="6.5" width="6" height="4" rx="2" fill="#99f6e4"/></svg>'
)}`;

function remToPixels(rem: number): number {
  return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

const meta = {
  title: "Data display/Avatar",
  component: Avatar,
  args: {
    name: "Pat Lee",
  },
  parameters: {
    a11y: { test: "error" },
  },
} satisfies Meta<typeof Avatar>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Without an image the avatar shows the name's initials on the secondary colour
 */
export const Default: Story = {
  play: async ({ canvas }) => {
    const avatar = canvas.getByRole("img", { name: "Pat Lee" });

    await expect(avatar.textContent).toBe("PL");
    await expect(avatar.getBoundingClientRect().width).toBeCloseTo(remToPixels(2), 1);
    await expect(textContrast(avatar)).toBeGreaterThanOrEqual(4.5);
  },
};

/**
 * With `src` the image fills the circle. It is decorative, because the avatar itself carries the name.
 */
export const WithImage: Story = {
  args: {
    src: portrait,
  },
  play: async ({ canvas }) => {
    const avatar = canvas.getByRole("img", { name: "Pat Lee" });
    const image = within(avatar).getByRole<HTMLImageElement>("presentation");

    await waitFor(() => expect(image.naturalWidth).toBeGreaterThan(0));
    await expect(avatar.textContent).toBe("");
    await expect(image.getBoundingClientRect().width).toBeCloseTo(avatar.getBoundingClientRect().width, 1);
    await expect(image.getBoundingClientRect().height).toBeCloseTo(avatar.getBoundingClientRect().height, 1);
  },
};

/**
 * `xs`, `sm`, `md` and `lg`. An `xs` avatar shows one initial.
 */
export const Sizes: Story = {
  render: () => (
    <Cluster align="center">
      {sizes.map((size) => (
        <Avatar key={size} name={`Pat Lee ${size}`} size={size} />
      ))}
    </Cluster>
  ),
  play: async ({ canvas }) => {
    for (const size of sizes) {
      const avatar = canvas.getByRole("img", { name: `Pat Lee ${size}` });
      const { height, width } = avatar.getBoundingClientRect();

      await expect(width, `${size} width`).toBeCloseTo(remToPixels(sizeRems[size]), 1);
      await expect(height, `${size} height`).toBeCloseTo(remToPixels(sizeRems[size]), 1);
      await expect(avatar.textContent, `${size} initials`).toBe(size === "xs" ? "P" : "PL");
      await expect(textContrast(avatar), size).toBeGreaterThanOrEqual(4.5);
    }
  },
};

/**
 * An image that fails to load shows the initials instead
 */
export const BrokenImage: Story = {
  args: {
    src: "data:image/png;base64,AAAA",
  },
  play: async ({ canvas }) => {
    const avatar = canvas.getByRole("img", { name: "Pat Lee" });

    await waitFor(() => expect(avatar.textContent).toBe("PL"));
    await expect(within(avatar).queryByRole("presentation")).toBeNull();
  },
};

/**
 * When the name is printed beside the avatar, `aria-hidden` stops screen readers reading it twice
 */
export const BesideName: Story = {
  render: () => (
    <Row align="center" gap={2}>
      <Avatar name="Pat Lee" size="sm" aria-hidden={true} />
      <Text>Pat Lee</Text>
    </Row>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("img")).toBeNull();
    await expect(canvas.getByRole("img", { hidden: true })).toHaveAttribute("aria-hidden", "true");
    await expect(canvas.getByText("Pat Lee")).toBeInTheDocument();
  },
};
