import { Description, Primary, Title } from "@storybook/addon-docs/blocks";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { JSX, SubmitEvent } from "react";
import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { expect, userEvent, within } from "storybook/test";

import { Alert } from "../components/Alert";
import { Box } from "../components/Box";
import { Button } from "../components/Button";
import { Center } from "../components/Center";
import { Checkbox } from "../components/Checkbox";
import { Cluster } from "../components/Cluster";
import { Field } from "../components/Field";
import { Fieldset } from "../components/Fieldset";
import { Heading } from "../components/Heading";
import { Link } from "../components/Link";
import { PageLayout } from "../components/PageLayout";
import { Radio } from "../components/Radio";
import { RadioGroup } from "../components/RadioGroup";
import { Row } from "../components/Row";
import { Select } from "../components/Select";
import { SkipLink } from "../components/SkipLink";
import { Stack } from "../components/Stack";
import { Switch } from "../components/Switch";
import { Text } from "../components/Text";
import { Textarea } from "../components/Textarea";
import { TextInput } from "../components/TextInput";

const requiredAnswers = [
  { error: "Enter your name", name: "name" },
  { error: "Enter your email address", name: "email" },
  { error: "Choose a topic", name: "topic" },
  { error: "Enter your message", name: "message" },
  { error: "Choose how soon you need a reply", name: "urgency" },
  { error: "Agree to the privacy notice to send your message", name: "consent" },
] as const;

type AnswerName = (typeof requiredAnswers)[number]["name"];

type AnswerErrors = Partial<Record<AnswerName, string>>;

/**
 * Names the control that takes an answer, so the error summary can link to it
 *
 * @param name the name the answer is submitted under
 * @returns the `id` of the control, or of the first radio when the answer is a radio group
 */
function controlId(name: AnswerName): string {
  return `contact-${name}`;
}

/**
 * Finds the required answers a submitted form leaves out
 *
 * @param formData the submitted form's data
 * @returns the error message for each missing answer, keyed by the answer's name
 */
function findErrors(formData: FormData): AnswerErrors {
  const errors: AnswerErrors = {};

  for (const { error, name } of requiredAnswers) {
    const answer = formData.get(name);

    if (typeof answer !== "string" || answer.trim() === "") {
      errors[name] = error;
    }
  }

  return errors;
}

function summaryTitle(problemCount: number): string {
  if (problemCount === 1) {
    return "There is 1 problem with your message";
  }

  return `There are ${problemCount} problems with your message`;
}

/**
 * The contact form with its own validation, its error summary and its confirmation
 */
function ContactForm(): JSX.Element {
  const [errors, setErrors] = useState<AnswerErrors>({});
  const [isSent, setIsSent] = useState(false);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const confirmationRef = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const problems = requiredAnswers.filter(({ name }) => errors[name] !== undefined);

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>): void => {
    // Submitting would load a new page in place of the story
    event.preventDefault();

    const form = event.currentTarget;
    const nextErrors = findErrors(new FormData(form));
    const isValid = Object.keys(nextErrors).length === 0;

    // The summary or the confirmation has to be rendered before it can take focus
    flushSync(() => {
      setErrors(nextErrors);
      setIsSent(isValid);
    });

    if (isValid) {
      form.reset();
      setIsSubscriber(false);
      confirmationRef.current?.focus();
    } else {
      summaryRef.current?.focus();
    }
  };

  return (
    <Stack gap={6}>
      {problems.length > 0 && (
        <Alert ref={summaryRef} role="alert" tabIndex={-1} title={summaryTitle(problems.length)} tone="danger">
          <Stack as="ul" gap={1}>
            {problems.map(({ error, name }) => (
              <Box as="li" key={name}>
                <Link href={`#${controlId(name)}`}>{error}</Link>
              </Box>
            ))}
          </Stack>
        </Alert>
      )}
      <Stack as="form" gap={5} noValidate={true} onSubmit={handleSubmit}>
        <Text as="p" tone="muted">
          Questions marked with an asterisk (*) need an answer.
        </Text>
        <Field controlId={controlId("name")} error={errors.name} label="Name" required={true}>
          <TextInput autoComplete="name" name="name" />
        </Field>
        <Field
          controlId={controlId("email")}
          description="We only use it to reply to you"
          error={errors.email}
          label="Email"
          required={true}
        >
          <TextInput autoComplete="email" name="email" type="email" />
        </Field>
        <Field controlId={controlId("topic")} error={errors.topic} label="Topic" required={true}>
          <Select defaultValue="" name="topic">
            <option value="">Choose a topic</option>
            <option value="correction">A correction to a post</option>
            <option value="writing">Writing for us</option>
            <option value="subscription">My subscription</option>
            <option value="other">Something else</option>
          </Select>
        </Field>
        <Switch
          checked={isSubscriber}
          onChange={(event) => {
            setIsSubscriber(event.currentTarget.checked);
          }}
        >
          I am a subscriber
        </Switch>
        {isSubscriber && (
          <Field
            description="It is in your welcome email. Leave this empty if you cannot find it."
            label="Subscriber number"
          >
            <TextInput inputMode="numeric" name="subscriberNumber" />
          </Field>
        )}
        <Field controlId={controlId("message")} error={errors.message} label="Message" required={true}>
          <Textarea name="message" rows={5} />
        </Field>
        <RadioGroup error={errors.urgency} label="How soon do you need a reply?" name="urgency" required={true}>
          <Radio id={controlId("urgency")} value="today">
            Today
          </Radio>
          <Radio value="week">This week</Radio>
          <Radio value="later">There is no rush</Radio>
        </RadioGroup>
        <Fieldset description="Choose any that interest you, or none" label="Email me about">
          <Stack gap={1}>
            <Checkbox name="updates" value="posts">
              New posts
            </Checkbox>
            <Checkbox name="updates" value="digest">
              The monthly digest
            </Checkbox>
            <Checkbox name="updates" value="events">
              Events
            </Checkbox>
          </Stack>
        </Fieldset>
        <Field controlId={controlId("consent")} error={errors.consent} required={true}>
          <Checkbox name="consent">I agree to the privacy notice</Checkbox>
        </Field>
        <Row>
          <Button type="submit">Send message</Button>
        </Row>
      </Stack>
      <Box aria-live="polite">
        {isSent && (
          <Alert ref={confirmationRef} tabIndex={-1} title="Message sent" tone="success">
            We reply within two working days.
          </Alert>
        )}
      </Box>
    </Stack>
  );
}

const meta = {
  title: "Examples/Contact form",
  parameters: {
    a11y: { test: "error" },
    docs: {
      // The default page repeats the first story in a list of all stories once a file has two
      page: () => (
        <>
          <Title />
          <Description of="story" />
          <Primary />
        </>
      ),
      story: { height: "48rem", inline: false },
    },
    layout: "fullscreen",
  },
  render: () => (
    <PageLayout gap={6}>
      <SkipLink href="#main">Skip to main content</SkipLink>
      <Center as="header" width="prose">
        <Row justify="between">
          <Text weight="bold">Field Notes</Text>
          <Cluster as="nav" aria-label="Main">
            <Link href="#posts" underline="hover">
              Posts
            </Link>
            <Link href="#about" underline="hover">
              About
            </Link>
            <Link href="#main" underline="hover" aria-current="page">
              Contact
            </Link>
          </Cluster>
        </Row>
      </Center>
      <Center as="main" id="main" width="prose">
        <Stack gap={6}>
          <Stack gap={2}>
            <Heading level={1}>Contact us</Heading>
            <Text as="p" tone="muted">
              Tell us what you need and we will reply by email.
            </Text>
          </Stack>
          <ContactForm />
        </Stack>
      </Center>
      <Center as="footer" width="prose">
        <Text tone="muted">Written in the open</Text>
      </Center>
    </PageLayout>
  ),
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * A full contact page. Each text control sits in a `Field`, the radios in a `RadioGroup`, the
 * checkboxes in a `Fieldset`, and the consent `Checkbox` labels itself inside a `Field` with no
 * `label`. The `Switch` takes effect at once, showing one more field.
 *
 * The form sets `noValidate` and checks the answers itself when it is submitted. Each missing
 * answer gets an `error` on its `Field` or group, and an `Alert` with `role="alert"` above the form
 * lists them all, each linked to its control. A failed submission moves focus to that summary. A
 * successful one moves focus to the confirmation below the form, which appears inside an
 * `aria-live="polite"` region that is always rendered.
 */
export const ContactPage: Story = {};

/**
 * The contact page after the form is submitted with every answer missing: the error summary takes
 * focus in view, and each required control is marked invalid and described by its error. It is
 * left off the Docs page, since submitting moves focus and scrolls the page.
 */
export const InvalidSubmission: Story = {
  tags: ["!autodocs"],
  play: async ({ canvas, canvasElement }) => {
    const requiredControls = [
      { control: canvas.getByRole("textbox", { name: "Name" }), errorDescription: "Enter your name" },
      {
        control: canvas.getByRole("textbox", { name: "Email" }),
        errorDescription: "We only use it to reply to you Enter your email address",
      },
      { control: canvas.getByRole("combobox", { name: "Topic" }), errorDescription: "Choose a topic" },
      { control: canvas.getByRole("textbox", { name: "Message" }), errorDescription: "Enter your message" },
      {
        control: canvas.getByRole("radiogroup", { name: "How soon do you need a reply?" }),
        errorDescription: "Choose how soon you need a reply",
      },
      {
        control: canvas.getByRole("checkbox", { name: "I agree to the privacy notice" }),
        errorDescription: "Agree to the privacy notice to send your message",
      },
    ];

    await expect(canvas.queryByRole("alert")).not.toBeInTheDocument();

    for (const { control } of requiredControls) {
      await expect(control).not.toHaveAttribute("aria-invalid");
    }

    await userEvent.click(canvas.getByRole("button", { name: "Send message" }));

    const summary = await canvas.findByRole("alert");
    const summaryBox = summary.getBoundingClientRect();
    const summaryLinks = within(summary).getAllByRole<HTMLAnchorElement>("link");

    await expect(summary).toHaveFocus();
    await expect(summaryBox.top).toBeGreaterThanOrEqual(0);
    await expect(summaryBox.bottom).toBeLessThanOrEqual(window.innerHeight);
    await expect(summary).toHaveTextContent("There are 6 problems with your message");
    await expect(summaryLinks).toHaveLength(requiredControls.length);

    for (const link of summaryLinks) {
      await expect(canvasElement.querySelector(link.hash), link.hash).toBeInTheDocument();
    }

    for (const { control, errorDescription } of requiredControls) {
      await expect(control).toHaveAttribute("aria-invalid", "true");
      await expect(control).toHaveAccessibleDescription(errorDescription);
    }
  },
};
