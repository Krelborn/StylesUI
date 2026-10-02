import { render, screen } from "@testing-library/react";
import type { JSX, ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { Box } from "../Box";
import type { ButtonProps } from "../Button";
import { Button } from "../Button";
import { Field } from "../Field";
import { TextInput } from "../TextInput";

import { Tooltip } from "./Tooltip";
import type { UseTooltipOptions } from "./useTooltip";
import { useTooltip } from "./useTooltip";

describe("useTooltip", () => {
  it("must describe the trigger with the tooltip text when relationship is omitted", () => {
    render(<Example />);

    expect(elements.publishButton).toHaveAccessibleDescription("Sends to all subscribers");
    expect(elements.visibleTooltip).toBeNull();
  });

  it("must name the trigger with the tooltip text when relationship is label", () => {
    render(
      <Example label={copyIcon} relationship="label">
        Copy link
      </Example>
    );

    expect(screen.getByRole("button", { name: "Copy link" })).not.toHaveAccessibleDescription();
  });

  it("must show the tooltip when open is true", () => {
    render(<Example open={true} />);

    expect(elements.visibleTooltip).toHaveAccessibleName("Sends to all subscribers");
  });

  it("must show the tooltip when defaultOpen is true", () => {
    render(<Example defaultOpen={true} />);

    expect(elements.visibleTooltip).toHaveAccessibleName("Sends to all subscribers");
  });

  it("must give each tooltip its own id when two are rendered", () => {
    render(
      <>
        <Example />
        <Example label="Archive">Hides it from subscribers</Example>
      </>
    );

    expect(elements.publishButton).toHaveAccessibleDescription("Sends to all subscribers");
    expect(screen.getByRole("button", { name: "Archive" })).toHaveAccessibleDescription("Hides it from subscribers");
  });

  it("must list the tooltip before the trigger's own description when getTriggerProps is given one", () => {
    render(
      <>
        <Example triggerProps={{ "aria-describedby": "publish-note" }} />
        <Box as="span" id="publish-note">
          Takes effect tomorrow
        </Box>
      </>
    );

    expect(elements.publishButton).toHaveAccessibleDescription("Sends to all subscribers Takes effect tomorrow");
  });

  it("must add the tooltip after the field's description when the trigger is a Field control", () => {
    render(<FieldExample />);

    expect(screen.getByRole("textbox", { name: "Display name" })).toHaveAccessibleDescription(
      "Shown on your profile Use the name people know you by"
    );
  });
});

interface ExampleProps extends UseTooltipOptions {
  /**
   * Tooltip text
   */
  children?: string;

  /**
   * Content of the trigger button
   */
  label?: ReactNode;

  /**
   * Props the trigger passes through `getTriggerProps`
   */
  triggerProps?: Pick<ButtonProps, "aria-describedby" | "onFocus">;
}

function Example({
  children = "Sends to all subscribers",
  label = "Publish",
  triggerProps,
  ...options
}: ExampleProps): JSX.Element {
  const tooltip = useTooltip(options);

  return (
    <>
      <Button {...tooltip.getTriggerProps(triggerProps)}>{label}</Button>
      <Tooltip {...tooltip.getOverlayProps()}>{children}</Tooltip>
    </>
  );
}

function FieldExample(): JSX.Element {
  const tooltip = useTooltip();

  return (
    <Field description="Shown on your profile" label="Display name">
      <TextInput {...tooltip.getTriggerProps()} />
      <Tooltip {...tooltip.getOverlayProps()}>Use the name people know you by</Tooltip>
    </Field>
  );
}

const copyIcon = (
  <Box as="svg" viewBox="0 0 16 16" aria-hidden="true">
    <Box as="path" d="M4 4h8v8H4z" />
  </Box>
);

const elements = {
  get publishButton() {
    return screen.getByRole("button", { name: "Publish" });
  },
  get visibleTooltip() {
    return screen.queryByRole("tooltip");
  },
};
