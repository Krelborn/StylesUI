import type { Meta, StoryObj } from "@storybook/react-vite";

import { Card } from "../components/Card";
import { Center } from "../components/Center";
import { Cluster } from "../components/Cluster";
import { Cover } from "../components/Cover";
import { Frame } from "../components/Frame";
import { Grid } from "../components/Grid";
import { Heading } from "../components/Heading";
import { PageLayout } from "../components/PageLayout";
import { Row } from "../components/Row";
import { Sidebar } from "../components/Sidebar";
import { Stack } from "../components/Stack";
import { Switcher } from "../components/Switcher";
import { Text } from "../components/Text";

const featureImage = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#0f766e"/><circle cx="400" cy="300" r="180" fill="#99f6e4"/></svg>'
)}`;

const meta = {
  title: "Examples/Blog page",
  parameters: {
    a11y: { test: "error" },
    docs: { story: { height: "48rem", inline: false } },
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * A full blog post page composed only from the layout containers plus `Card`, `Heading` and
 * `Text`.
 */
export const PostPage: Story = {
  render: () => (
    <PageLayout>
      <Center as="header" width="wide">
        <Row justify="between">
          <Text weight="bold">Field Notes</Text>
          <Cluster as="nav" aria-label="Main">
            <Text>Posts</Text>
            <Text>About</Text>
          </Cluster>
        </Row>
      </Center>
      <Center as="main" width="wide">
        <Stack gap={8}>
          <Cover minimumHeight="16rem" top={<Text tone="muted">Essay</Text>}>
            <Heading level={1}>Designing with intrinsic layouts</Heading>
          </Cover>
          <Sidebar sideWidth="16rem">
            <Stack as="article" gap={6}>
              <Frame ratio="16 / 9">
                <img alt="Teal circle on a dark teal background" src={featureImage} />
              </Frame>
              <Row gap={3}>
                <Text weight="bold">Ada Lovelace</Text>
                <Text tone="muted">6 min read</Text>
              </Row>
              <Text as="p">
                Intrinsic layouts let content decide where things wrap, so a page adapts to its container instead of to
                a list of breakpoints.
              </Text>
              <Cluster as="ul" aria-label="Tags">
                <li>
                  <Text>#css</Text>
                </li>
                <li>
                  <Text>#layout</Text>
                </li>
              </Cluster>
              <Switcher as="nav" threshold="28rem" aria-label="More posts">
                <Card>Previous: Theming tokens</Card>
                <Card>Next: Accessible colour</Card>
              </Switcher>
            </Stack>
            <Stack as="aside" gap={3} aria-label="Related">
              <Heading level={2} size="md">
                Related
              </Heading>
              <Grid as="ul" gap={2} minimumItemWidth="12rem">
                <li>
                  <Card padding="sm">Every Layout primitives</Card>
                </li>
                <li>
                  <Card padding="sm">Container queries</Card>
                </li>
              </Grid>
            </Stack>
          </Sidebar>
        </Stack>
      </Center>
      <Center as="footer" width="wide">
        <Text tone="muted">Written in the open</Text>
      </Center>
    </PageLayout>
  ),
};
