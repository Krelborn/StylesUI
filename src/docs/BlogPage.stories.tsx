import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge } from "../components/Badge";
import { Card } from "../components/Card";
import { Center } from "../components/Center";
import { Cluster } from "../components/Cluster";
import { Cover } from "../components/Cover";
import { Divider } from "../components/Divider";
import { Frame } from "../components/Frame";
import { Grid } from "../components/Grid";
import { Heading } from "../components/Heading";
import { Link } from "../components/Link";
import { PageLayout } from "../components/PageLayout";
import { Prose } from "../components/Prose";
import { Row } from "../components/Row";
import { Sidebar } from "../components/Sidebar";
import { SkipLink } from "../components/SkipLink";
import { Stack } from "../components/Stack";
import { Switcher } from "../components/Switcher";
import { Text } from "../components/Text";
import { VisuallyHidden } from "../components/VisuallyHidden";

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
 * A full blog post page. A `SkipLink` is the first Tab stop and goes to the `main` element, the
 * navigation uses `Link`, the article body is raw HTML inside `Prose`, the tags are `Badge`s, and
 * the layout containers arrange the page.
 */
export const PostPage: Story = {
  render: () => (
    <PageLayout>
      <SkipLink href="#main">Skip to main content</SkipLink>
      <Center as="header" width="wide">
        <Row justify="between">
          <Text weight="bold">Field Notes</Text>
          <Cluster as="nav" aria-label="Main">
            <Link href="#posts" underline="hover">
              Posts
            </Link>
            <Link href="#about" underline="hover">
              About
            </Link>
          </Cluster>
        </Row>
      </Center>
      <Center as="main" id="main" width="wide">
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
                <Text weight="bold">
                  <VisuallyHidden>Written by </VisuallyHidden>Ada Lovelace
                </Text>
                <Text tone="muted">6 min read</Text>
              </Row>
              <Prose>
                <p>
                  Intrinsic layouts let content decide where things wrap, so a page adapts to its container instead of
                  to a list of breakpoints.
                </p>
                <h2>Let the content set the breakpoint</h2>
                <p>
                  A row that wraps when its items no longer fit needs no media query. Give each item a smallest useful
                  width with <code>flex-basis</code> or <code>minmax()</code>, and the same component works in a wide
                  page and in a narrow sidebar. The <a href="#related">related reading</a> goes further.
                </p>
                <ul>
                  <li>Wrap content instead of letting it overflow</li>
                  <li>Set a minimum width, not a fixed one</li>
                  <li>Space items with gaps, not margins</li>
                </ul>
                <blockquote>
                  <p>Describe the layout you want, and let the browser work out the rest.</p>
                </blockquote>
              </Prose>
              <Cluster as="ul" aria-label="Tags">
                <li>
                  <Badge>#css</Badge>
                </li>
                <li>
                  <Badge>#layout</Badge>
                </li>
              </Cluster>
              <Divider />
              <Switcher as="nav" threshold="28rem" aria-label="More posts">
                <Card>
                  <Link href="#previous">Previous: Theming tokens</Link>
                </Card>
                <Card>
                  <Link href="#next">Next: Accessible colour</Link>
                </Card>
              </Switcher>
            </Stack>
            <Stack as="aside" gap={3} id="related" aria-label="Related">
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
