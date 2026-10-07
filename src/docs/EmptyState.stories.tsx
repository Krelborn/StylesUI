import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties, JSX } from "react";
import { useId } from "react";
import { expect } from "storybook/test";

import { Box } from "../components/Box";
import { Button } from "../components/Button";
import { Center } from "../components/Center";
import { Cover } from "../components/Cover";
import { Heading } from "../components/Heading";
import { Stack } from "../components/Stack";
import { Text } from "../components/Text";

const paneStyle: CSSProperties = {
  blockSize: "20rem",
  border: "var(--sui-border-width) solid var(--sui-color-border)",
  borderRadius: "var(--sui-radius-md)",
};

const meta = {
  title: "Examples/Empty state",
  parameters: {
    a11y: { test: "error" },
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * A list with nothing in it yet, and the action that fills it. `Cover` centres the message in its pane, `Center`
 * keeps it to a readable width, and the heading level follows the page outline.
 */
export const WithAction: Story = {
  render: () => (
    <Box as="section" style={paneStyle} aria-label="Pull requests">
      <Cover minimumHeight="100%">
        <Center intrinsic={true} style={{ textAlign: "center" }} width="prose">
          <Stack align="center" gap={2}>
            <Heading level={2} size="lg">
              No pull requests yet
            </Heading>
            <Text as="p" tone="muted">
              Connect a repository to see the pull requests waiting for your review.
            </Text>
            <Button>Connect a repository</Button>
          </Stack>
        </Center>
      </Cover>
    </Box>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { level: 2, name: "No pull requests yet" })).toBeInTheDocument();
  },
};

/**
 * A pane of search results, headed at level 2, whose empty state sits under that heading
 */
function SearchResultsPane(): JSX.Element {
  const headingId = useId();

  return (
    <Box as="section" style={paneStyle} aria-labelledby={headingId}>
      <Cover
        minimumHeight="100%"
        top={
          <Heading id={headingId} level={2} size="md">
            Search results
          </Heading>
        }
      >
        <Center intrinsic={true} style={{ textAlign: "center" }} width="prose">
          <Stack align="center" gap={2}>
            <Heading level={3} size="lg">
              No matches
            </Heading>
            <Text as="p" tone="muted">
              No pull requests match “flaky test”. Try a different search.
            </Text>
          </Stack>
        </Center>
      </Cover>
    </Box>
  );
}

/**
 * A search with no matches has nothing to do, so it has no action. The empty state sits in a pane under a level 2
 * heading, so its own heading is level 3.
 */
export const NoResults: Story = {
  render: () => <SearchResultsPane />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { level: 2, name: "Search results" })).toBeInTheDocument();
    await expect(canvas.getByRole("heading", { level: 3, name: "No matches" })).toBeInTheDocument();
  },
};
