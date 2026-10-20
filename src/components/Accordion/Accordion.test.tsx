import { fireEvent, render as renderBase, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import plusArtwork from "lucide-static/icons/plus.svg?raw";
import { isValidElement } from "react";
import { describe, expect, it, vi } from "vitest";

import { MissingContextError } from "../../errors";

import type { AccordionVariant } from "./Accordion";
import { Accordion } from "./Accordion";
import { AccordionItem } from "./AccordionItem";

const inspectorSections = [
  { title: "Layout", value: "layout" },
  { title: "Fill", value: "fill" },
  { title: "Stroke", value: "stroke" },
];

describe("Accordion", () => {
  it("must put each toggle in a heading at the given level when it renders", () => {
    const { render } = setUpTest();

    render({ headingLevel: 4 });

    expect(within(screen.getByRole("heading", { level: 4, name: "Fill" })).getByRole("button")).toBe(
      elements.toggle("Fill")
    );
    expect(elements.toggle("Fill")).toHaveAttribute("type", "button");
  });

  it("must link each toggle to its panel when it renders", () => {
    const { render } = setUpTest();

    render({ selection: { defaultValue: ["fill"] } });

    expect(elements.panelOf("Fill")).toHaveTextContent("Fill content");
  });

  it("must open the items in defaultValue when it renders", () => {
    const { render } = setUpTest();

    render({ selection: { defaultValue: ["fill"] } });

    expect(elements.toggle("Fill")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Fill content")).toBeVisible();
    expect(elements.toggle("Layout")).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("Layout content")).not.toBeVisible();
  });

  it("must open an item and report the open items when a closed item's toggle is clicked", async () => {
    const { onValueChange, render, user } = setUpTest();
    render({ selection: { defaultValue: ["layout"] } });

    await user.click(elements.toggle("Stroke"));

    expect(elements.toggle("Stroke")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Stroke content")).toBeVisible();
    expect(onValueChange).toHaveBeenLastCalledWith(["layout", "stroke"]);
  });

  it("must close an item and report the open items when an open item's toggle is clicked", async () => {
    const { onValueChange, render, user } = setUpTest();
    render({ selection: { defaultValue: ["layout", "fill"] } });

    await user.click(elements.toggle("Layout"));

    expect(elements.toggle("Layout")).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("Layout content")).not.toBeVisible();
    expect(onValueChange).toHaveBeenLastCalledWith(["fill"]);
  });

  it.each(["{Enter}", " "])("must toggle an item when '%s' is pressed on its toggle", async (key) => {
    const { render, user } = setUpTest();
    render();
    await user.tab();

    await user.keyboard(key);
    const afterFirstPress = elements.toggle("Layout").getAttribute("aria-expanded");
    await user.keyboard(key);

    expect(afterFirstPress).toBe("true");
    expect(elements.toggle("Layout")).toHaveAttribute("aria-expanded", "false");
  });

  it("must close the other items and report only the opened one when it is exclusive", async () => {
    const { onValueChange, render, user } = setUpTest();
    render({ exclusive: true, selection: { defaultValue: ["layout"] } });

    await user.click(elements.toggle("Fill"));

    expect(elements.toggle("Layout")).toHaveAttribute("aria-expanded", "false");
    expect(elements.toggle("Fill")).toHaveAttribute("aria-expanded", "true");
    expect(onValueChange).toHaveBeenLastCalledWith(["fill"]);
  });

  it("must report no open items when the open item of an exclusive accordion is closed", async () => {
    const { onValueChange, render, user } = setUpTest();
    render({ exclusive: true, selection: { defaultValue: ["layout"] } });

    await user.click(elements.toggle("Layout"));

    expect(elements.toggle("Layout")).toHaveAttribute("aria-expanded", "false");
    expect(onValueChange).toHaveBeenLastCalledWith([]);
  });

  it("must follow only value when it is controlled", async () => {
    const { onValueChange, render, user } = setUpTest();
    render({ selection: { value: ["layout"] } });

    await user.click(elements.toggle("Fill"));

    expect(onValueChange).toHaveBeenLastCalledWith(["layout", "fill"]);
    expect(elements.toggle("Fill")).toHaveAttribute("aria-expanded", "false");
    expect(elements.toggle("Layout")).toHaveAttribute("aria-expanded", "true");
  });

  it.each<{ isRegion: boolean; variant: AccordionVariant }>([
    { isRegion: false, variant: "flush" },
    { isRegion: true, variant: "joined" },
    { isRegion: true, variant: "separated" },
  ])(
    "must make a panel a region named by its toggle only by default when the variant is $variant",
    ({ isRegion, variant }) => {
      const { render } = setUpTest();

      render({ selection: { defaultValue: ["fill"] }, variant });

      expect(screen.queryByRole("region", { name: "Fill" }) !== null).toBe(isRegion);
    }
  );

  it("must name a region by its title alone when the item has a description and trailing content", () => {
    renderBase(
      <Accordion defaultValue={["fill"]} headingLevel={3} variant="joined">
        <AccordionItem description="Two layers" title="Fill" trailing="3" value="fill">
          Fill content
        </AccordionItem>
      </Accordion>
    );

    expect(screen.getByRole("region", { name: "Fill" })).toHaveTextContent("Fill content");
  });

  it.each<{ regions: boolean; variant: AccordionVariant }>([
    { regions: true, variant: "flush" },
    { regions: false, variant: "joined" },
  ])(
    "must follow regions over the variant's default when regions is $regions and the variant is $variant",
    ({ regions, variant }) => {
      const { render } = setUpTest();

      render({ regions, selection: { defaultValue: ["fill"] }, variant });

      expect(screen.queryByRole("region", { name: "Fill" }) !== null).toBe(regions);
    }
  );

  it("must read the description and trailing content after the title when an item has them", () => {
    renderBase(
      <Accordion headingLevel={3}>
        <AccordionItem description="Two layers" title="Fill" trailing="3" value="fill" />
      </Accordion>
    );

    expect(screen.getByRole("button", { name: "Fill Two layers 3" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Fill Two layers 3");
  });

  it("must keep actions outside the heading when an item has them", () => {
    renderBase(
      <Accordion headingLevel={3}>
        <AccordionItem actions={<button type="button">Add fill</button>} title="Fill" value="fill" />
      </Accordion>
    );

    expect(screen.getByRole("heading", { level: 3 })).not.toContainElement(
      screen.getByRole("button", { name: "Add fill" })
    );
    expect(elements.toggle("Fill")).toBeInTheDocument();
  });

  it.each([
    { content: "First", title: "A B", value: "a b" },
    { content: "Second", title: "X Y", value: 'x/"y"?' },
    { content: "Third", title: "Surrogate", value: "\uD800" },
  ])("must link a toggle to its panel with unique ids when the value is '$value'", ({ content, title, value }) => {
    renderBase(
      <Accordion defaultValue={[value]} headingLevel={3}>
        <AccordionItem title="A B" value="a b">
          First
        </AccordionItem>
        <AccordionItem title="X Y" value={'x/"y"?'}>
          Second
        </AccordionItem>
        <AccordionItem title="Surrogate" value={"\uD800"}>
          Third
        </AccordionItem>
      </Accordion>
    );

    const allIds = screen
      .getAllByRole("button")
      .flatMap((button) => [button.id, button.getAttribute("aria-controls") ?? ""]);

    expect(elements.panelOf(title)).toHaveTextContent(content);
    expect(elements.panelOf(title)).toBeVisible();
    expect(elements.toggle(title).id).not.toMatch(/\s/);
    expect(new Set(allIds).size).toBe(6);
  });

  it("must hide a closed panel until it is found when it renders and when it closes again", async () => {
    const consoleError = vi.spyOn(console, "error");
    const { render, user } = setUpTest();
    render();

    const afterRender = elements.panelOf("Fill")?.getAttribute("hidden");
    await user.click(elements.toggle("Fill"));
    const whileOpen = elements.panelOf("Fill")?.getAttribute("hidden");
    await user.click(elements.toggle("Fill"));

    expect(afterRender).toBe("until-found");
    expect(whileOpen).toBeNull();
    expect(elements.panelOf("Fill")).toHaveAttribute("hidden", "until-found");
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("must open an item and report the open items when the browser finds a match in its panel", () => {
    const { onValueChange, render } = setUpTest();
    render({ selection: { defaultValue: ["layout"] } });

    findInPage(elements.panelOf("Stroke"));

    expect(elements.toggle("Stroke")).toHaveAttribute("aria-expanded", "true");
    expect(elements.panelOf("Stroke")).toBeVisible();
    expect(onValueChange).toHaveBeenLastCalledWith(["layout", "stroke"]);
  });

  it("must close the other items when the browser finds a match in an exclusive accordion", () => {
    const { render } = setUpTest();
    render({ exclusive: true, selection: { defaultValue: ["layout"] } });

    findInPage(elements.panelOf("Stroke"));

    expect(elements.toggle("Stroke")).toHaveAttribute("aria-expanded", "true");
    expect(elements.toggle("Layout")).toHaveAttribute("aria-expanded", "false");
  });

  it("must hide the panel until it is found again when a controlled parent keeps a found item closed", () => {
    const { onValueChange, render } = setUpTest();
    render({ selection: { value: [] } });

    findInPage(elements.panelOf("Stroke"));

    expect(onValueChange).toHaveBeenLastCalledWith(["stroke"]);
    expect(elements.toggle("Stroke")).toHaveAttribute("aria-expanded", "false");
    expect(elements.panelOf("Stroke")).toHaveAttribute("hidden", "until-found");
  });

  it("must keep a disabled item closed and reachable when its toggle is clicked or pressed", async () => {
    const { onValueChange, render, user } = setUpTest();
    render({ disabledValue: "layout" });

    await user.click(elements.toggle("Layout"));
    await user.keyboard("{Enter}");
    await user.keyboard(" ");

    expect(elements.toggle("Layout")).toHaveFocus();
    expect(elements.toggle("Layout")).toHaveAttribute("aria-disabled", "true");
    expect(elements.toggle("Layout")).toHaveAttribute("aria-expanded", "false");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("must hide a disabled item's closed panel from find-in-page when it renders", () => {
    const { render } = setUpTest();

    render({ disabledValue: "layout" });

    expect(elements.panelOf("Layout")).toHaveAttribute("hidden", "");
    expect(elements.panelOf("Fill")).toHaveAttribute("hidden", "until-found");
  });

  it("must hide a closed panel from find-in-page when its item becomes disabled", () => {
    const item = (disabled: boolean) => (
      <Accordion headingLevel={3}>
        <AccordionItem disabled={disabled} title="Fill" value="fill">
          Fill content
        </AccordionItem>
      </Accordion>
    );
    const { rerender } = renderBase(item(false));

    rerender(item(true));

    expect(elements.panelOf("Fill")).toHaveAttribute("hidden", "");
  });

  it("must render a lazy item's content only once it has opened when the item is lazy", async () => {
    const { render, user } = setUpTest();
    render({ lazyValue: "stroke" });

    const beforeOpening = elements.panelOf("Stroke")?.textContent;
    await user.click(elements.toggle("Stroke"));
    await user.click(elements.toggle("Stroke"));

    expect(beforeOpening).toBe("");
    expect(elements.panelOf("Stroke")).toHaveTextContent("Stroke content");
    expect(elements.panelOf("Fill")).toHaveTextContent("Fill content");
  });

  it("must move focus to the next and previous toggle without wrapping when Down and Up are pressed", async () => {
    const { render, user } = setUpTest();
    render({ disabledValue: "fill" });
    await user.tab();

    await user.keyboard("{ArrowDown}");
    const afterDown = document.activeElement;
    await user.keyboard("{ArrowDown}{ArrowDown}");
    const atEnd = document.activeElement;
    await user.keyboard("{ArrowUp}{ArrowUp}{ArrowUp}");

    expect(afterDown).toBe(elements.toggle("Fill"));
    expect(atEnd).toBe(elements.toggle("Stroke"));
    expect(elements.toggle("Layout")).toHaveFocus();
  });

  it("must move focus to the first and last toggle when Home and End are pressed", async () => {
    const { render, user } = setUpTest();
    render();
    await user.tab();

    await user.keyboard("{End}");
    const afterEnd = document.activeElement;
    await user.keyboard("{Home}");

    expect(afterEnd).toBe(elements.toggle("Stroke"));
    expect(elements.toggle("Layout")).toHaveFocus();
  });

  it("must move only between a nested accordion's toggles when a key is pressed inside it", async () => {
    const user = userEvent.setup();
    renderBase(
      <Accordion defaultValue={["layout"]} headingLevel={3}>
        <AccordionItem title="Layout" value="layout">
          <Accordion headingLevel={4}>
            <AccordionItem title="Constraints" value="constraints" />
            <AccordionItem title="Spacing" value="spacing" />
          </Accordion>
        </AccordionItem>
        <AccordionItem title="Fill" value="fill" />
      </Accordion>
    );
    elements.toggle("Constraints").focus();

    await user.keyboard("{ArrowDown}");
    const afterDown = document.activeElement;
    await user.keyboard("{ArrowDown}{End}");
    const afterEnd = document.activeElement;
    await user.keyboard("{Home}{ArrowUp}");

    expect(afterDown).toBe(elements.toggle("Spacing"));
    expect(afterEnd).toBe(elements.toggle("Spacing"));
    expect(elements.toggle("Constraints")).toHaveFocus();
  });

  it.each([
    "{Alt>}{ArrowDown}{/Alt}",
    "{Control>}{ArrowDown}{/Control}",
    "{Meta>}{End}{/Meta}",
    "{Shift>}{End}{/Shift}",
  ])("must leave focus where it is when '%s' is pressed", async (keys) => {
    const { render, user } = setUpTest();
    render();
    await user.tab();

    await user.keyboard(keys);

    expect(elements.toggle("Layout")).toHaveFocus();
  });

  it("must leave focus where it is when a consumer prevents the key's default", async () => {
    const user = userEvent.setup();
    renderBase(
      <div onKeyDownCapture={(event) => event.preventDefault()}>
        <Accordion headingLevel={3}>
          <AccordionItem title="Layout" value="layout" />
          <AccordionItem title="Fill" value="fill" />
        </Accordion>
      </div>
    );
    await user.tab();

    await user.keyboard("{ArrowDown}");

    expect(elements.toggle("Layout")).toHaveFocus();
  });

  it("must draw Lucide's plus as the indicator when the indicator is plusMinus", () => {
    const lucidePlus = new DOMParser().parseFromString(plusArtwork, "image/svg+xml").documentElement;
    renderBase(
      <Accordion headingLevel={3} indicator="plusMinus">
        <AccordionItem title="Fill" value="fill" />
      </Accordion>
    );

    const indicator = elements.toggle("Fill").querySelector("svg");

    expect(pathsOf(indicator)).toEqual(pathsOf(lucidePlus));
    expect(indicator).toHaveAttribute("aria-hidden", "true");
  });

  it("must pass other props to the item's element when they are given", () => {
    renderBase(
      <Accordion headingLevel={3}>
        <AccordionItem title="Fill" value="fill" data-testid="fill-item" />
      </Accordion>
    );

    expect(screen.getByTestId("fill-item")).toContainElement(elements.toggle("Fill"));
  });

  it("must throw a MissingContextError when an item renders outside an Accordion", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(() => renderBase(<AccordionItem title="Fill" value="fill" />)).toThrow(MissingContextError);
  });

  it("must reject value when it is given with defaultValue", () => {
    renderBase(
      // @ts-expect-error an accordion is either controlled or uncontrolled
      <Accordion defaultValue={["fill"]} headingLevel={3} value={["fill"]}>
        <AccordionItem title="Fill" value="fill" />
      </Accordion>
    );
  });

  it("must reject an accordion when it has no heading level", () => {
    renderBase(
      // @ts-expect-error only the page outline knows the heading level
      <Accordion>
        <AccordionItem title="Fill" value="fill" />
      </Accordion>
    );
  });

  it("must reject an item when it has no title", () => {
    renderBase(
      <Accordion headingLevel={3}>
        {/* @ts-expect-error an item's toggle needs a title */}
        <AccordionItem value="fill" />
      </Accordion>
    );
  });

  it("must reject dangerouslySetInnerHTML when it is given to an item", () => {
    // Built without rendering, since React throws when an element with children is given inner HTML
    // @ts-expect-error an item renders its own header and panel
    const element = <AccordionItem dangerouslySetInnerHTML={{ __html: "Stroke" }} title="Stroke" value="stroke" />;

    expect(isValidElement(element)).toBe(true);
  });
});

interface RenderOptions {
  disabledValue?: string;
  exclusive?: boolean;
  headingLevel?: 2 | 3 | 4;
  lazyValue?: string;
  regions?: boolean;
  selection?: { defaultValue: string[] } | { value: string[] };
  variant?: AccordionVariant;
}

function setUpTest() {
  const user = userEvent.setup();
  const onValueChange = vi.fn();

  const render = ({
    disabledValue,
    exclusive,
    headingLevel = 3,
    lazyValue,
    regions,
    selection = { defaultValue: [] },
    variant,
  }: RenderOptions = {}): void => {
    renderBase(
      <Accordion
        {...selection}
        exclusive={exclusive}
        headingLevel={headingLevel}
        onValueChange={onValueChange}
        regions={regions}
        variant={variant}
      >
        {inspectorSections.map(({ title, value }) => (
          <AccordionItem
            disabled={value === disabledValue}
            key={value}
            lazy={value === lazyValue}
            title={title}
            value={value}
          >
            {`${title} content`}
          </AccordionItem>
        ))}
      </Accordion>
    );
  };

  return { onValueChange, render, user };
}

/**
 * Lists the path data an svg draws
 *
 * @param svg the svg element, or null when there is none
 * @returns each path's `d`, in document order
 */
function pathsOf(svg: Element | null): (string | null)[] {
  return Array.from(svg?.querySelectorAll("path") ?? [], (path) => path.getAttribute("d"));
}

/**
 * Does what the browser does when find-in-page or a fragment link matches inside a panel hidden until found
 *
 * @param panel the panel holding the match
 */
function findInPage(panel: HTMLElement | null): void {
  if (panel === null) {
    throw new Error("No panel to find a match in");
  }

  panel.removeAttribute("hidden");
  fireEvent(panel, new Event("beforematch", { bubbles: true }));
}

const elements = {
  panelOf(toggleName: string): HTMLElement | null {
    return document.getElementById(
      screen.getByRole("button", { name: toggleName }).getAttribute("aria-controls") ?? ""
    );
  },

  toggle(name: string): HTMLElement {
    return screen.getByRole("button", { name });
  },
};
