import { fireEvent, render as renderBase, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, onTestFinished, vi } from "vitest";

import type { WritingDirection } from "../../collections";
import { MissingContextError } from "../../errors";
import { transitionedProperties } from "../../test/transitionedProperties";

import { Tab } from "./Tab";
import { TabList } from "./TabList";
import { TabPanel } from "./TabPanel";
import type { TabsActivation, TabsOrientation } from "./Tabs";
import { Tabs } from "./Tabs";
import tabsCss from "./Tabs.module.css?raw";

const repositoryTabs = [
  { label: "Code", value: "code" },
  { label: "Issues", value: "issues" },
  { label: "Wiki", value: "wiki" },
];

describe("Tabs", () => {
  it("must name each panel by its tab when a tab is selected", () => {
    const { render } = setUpTest();

    render();

    expect(screen.getByRole("tabpanel", { name: "Code" })).toHaveTextContent("Code content");
    expect(elements.tab("Code")).toHaveAttribute("aria-controls", screen.getByRole("tabpanel").id);
  });

  it.each([
    { content: "First", label: "A B", value: "a b" },
    { content: "Second", label: "X Y", value: "x/y?" },
  ])("must link a tab and its panel when the value is '$value'", ({ content, label, value }) => {
    renderBase(
      <Tabs defaultValue={value}>
        <TabList aria-label="Odd values">
          <Tab value="a b">A B</Tab>
          <Tab value="x/y?">X Y</Tab>
        </TabList>
        <TabPanel value="a b">First</TabPanel>
        <TabPanel value="x/y?">Second</TabPanel>
      </Tabs>
    );

    const panel = screen.getByRole("tabpanel", { name: label });
    const allIds = [...screen.getAllByRole("tab"), ...screen.getAllByRole("tabpanel", { hidden: true })].map(
      (element) => element.id
    );

    expect(panel).toHaveTextContent(content);
    expect(elements.tab(label)).toHaveAttribute("aria-controls", panel.id);
    expect(panel.id).not.toContain(" ");
    expect(new Set(allIds).size).toBe(4);
  });

  it("must select the tab given in defaultValue when it renders", () => {
    const { render } = setUpTest();

    render({ selection: { defaultValue: "issues" } });

    expect(elements.tab("Issues")).toHaveAttribute("aria-selected", "true");
    expect(elements.tab("Code")).toHaveAttribute("aria-selected", "false");
  });

  it("must select and report a tab when it is clicked", async () => {
    const { onValueChange, render, user } = setUpTest();
    render();

    await user.click(elements.tab("Issues"));

    expect(elements.tab("Issues")).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name: "Issues" })).toHaveTextContent("Issues content");
    expect(onValueChange).toHaveBeenLastCalledWith("issues");
  });

  it("must follow only value when it is controlled", async () => {
    const { onValueChange, render, user } = setUpTest();
    render({ selection: { value: "code" } });

    await user.click(elements.tab("Issues"));

    expect(onValueChange).toHaveBeenLastCalledWith("issues");
    expect(elements.tab("Code")).toHaveAttribute("aria-selected", "true");
  });

  it("must move focus and select when an arrow key is pressed with automatic activation", async () => {
    const { onValueChange, render, user } = setUpTest();
    render();
    await user.tab();

    await user.keyboard("{ArrowRight}");

    expect(elements.tab("Issues")).toHaveFocus();
    expect(elements.tab("Issues")).toHaveAttribute("aria-selected", "true");
    expect(onValueChange).toHaveBeenLastCalledWith("issues");
  });

  it("must wrap to the other end when an arrow key is pressed at either end", async () => {
    const { render, user } = setUpTest();
    render();
    await user.tab();

    await user.keyboard("{ArrowLeft}");
    const afterLeft = document.activeElement;
    await user.keyboard("{ArrowRight}");

    expect(afterLeft).toBe(elements.tab("Wiki"));
    expect(elements.tab("Code")).toHaveFocus();
  });

  it("must move to the first and last tab when Home and End are pressed", async () => {
    const { render, user } = setUpTest();
    render({ selection: { defaultValue: "issues" } });
    await user.tab();

    await user.keyboard("{End}");
    const afterEnd = document.activeElement;
    await user.keyboard("{Home}");

    expect(afterEnd).toBe(elements.tab("Wiki"));
    expect(elements.tab("Code")).toHaveFocus();
  });

  it("must use Up and Down and ignore Left and Right when the tabs are vertical", async () => {
    const { render, user } = setUpTest();
    render({ orientation: "vertical" });
    await user.tab();

    await user.keyboard("{ArrowRight}");
    const afterRight = document.activeElement;
    await user.keyboard("{ArrowDown}");

    expect(afterRight).toBe(elements.tab("Code"));
    expect(elements.tab("Issues")).toHaveFocus();
    expect(screen.getByRole("tablist", { name: "Repository" })).toHaveAttribute("aria-orientation", "vertical");
  });

  it("must swap Left and Right when the tabs are right to left", async () => {
    const { render, user } = setUpTest();
    render({ direction: "rtl" });
    await user.tab();

    await user.keyboard("{ArrowLeft}");
    const afterLeft = document.activeElement;
    await user.keyboard("{ArrowRight}");

    expect(afterLeft).toBe(elements.tab("Issues"));
    expect(elements.tab("Code")).toHaveFocus();
  });

  it("must move focus without selecting when an arrow key is pressed with manual activation", async () => {
    const { onValueChange, render, user } = setUpTest();
    render({ activation: "manual" });
    await user.tab();

    await user.keyboard("{ArrowRight}");

    expect(elements.tab("Issues")).toHaveFocus();
    expect(elements.tab("Code")).toHaveAttribute("aria-selected", "true");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it.each(["{Enter}", " "])("must select the focused tab when %s is pressed with manual activation", async (key) => {
    const { onValueChange, render, user } = setUpTest();
    render({ activation: "manual" });
    await user.tab();
    await user.keyboard("{ArrowRight}");

    await user.keyboard(key);

    expect(elements.tab("Issues")).toHaveAttribute("aria-selected", "true");
    expect(onValueChange).toHaveBeenLastCalledWith("issues");
  });

  it("must reach a disabled tab with the arrow keys without selecting it", async () => {
    const { onValueChange, render, user } = setUpTest();
    render({ disabledValue: "issues" });
    await user.tab();

    await user.keyboard("{ArrowRight}");

    expect(elements.tab("Issues")).toHaveFocus();
    expect(elements.tab("Issues")).toHaveAttribute("aria-disabled", "true");
    expect(elements.tab("Code")).toHaveAttribute("aria-selected", "true");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("must not select a disabled tab when it is clicked", async () => {
    const { onValueChange, render, user } = setUpTest();
    render({ disabledValue: "issues" });

    await user.click(elements.tab("Issues"));

    expect(elements.tab("Code")).toHaveAttribute("aria-selected", "true");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("must not call the consumer's onClick when a disabled tab is clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderBase(
      <Tabs defaultValue="code">
        <TabList aria-label="Repository">
          <Tab value="code">Code</Tab>
          <Tab disabled={true} onClick={onClick} value="wiki">
            Wiki
          </Tab>
        </TabList>
      </Tabs>
    );

    await user.click(elements.tab("Wiki"));

    expect(onClick).not.toHaveBeenCalled();
    expect(elements.tab("Code")).toHaveAttribute("aria-selected", "true");
  });

  it("must call the consumer's onClick and select the tab when an enabled tab is clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    renderBase(
      <Tabs defaultValue="code">
        <TabList aria-label="Repository">
          <Tab value="code">Code</Tab>
          <Tab onClick={onClick} value="wiki">
            Wiki
          </Tab>
        </TabList>
      </Tabs>
    );

    await user.click(elements.tab("Wiki"));

    expect(onClick).toHaveBeenCalled();
    expect(elements.tab("Wiki")).toHaveAttribute("aria-selected", "true");
  });

  it("must put only the selected tab in the tab order when it renders", async () => {
    const { render, user } = setUpTest();
    render({ selection: { defaultValue: "issues" } });

    await user.tab();
    const firstStop = document.activeElement;
    await user.tab();

    expect(firstStop).toBe(elements.tab("Issues"));
    expect(screen.getByRole("tabpanel", { name: "Issues" })).toHaveFocus();
    expect(elements.tab("Code")).toHaveAttribute("tabindex", "-1");
  });

  it("must let a panel leave the tab order when tabIndex is -1", () => {
    renderBase(
      <Tabs defaultValue="code">
        <TabList aria-label="Repository">
          <Tab value="code">Code</Tab>
        </TabList>
        <TabPanel tabIndex={-1} value="code">
          Code content
        </TabPanel>
      </Tabs>
    );

    expect(screen.getByRole("tabpanel", { name: "Code" })).toHaveAttribute("tabindex", "-1");
  });

  it("must hide and empty the panels of the tabs that are not selected", () => {
    const { render } = setUpTest();

    render();

    const hiddenPanels = screen
      .getAllByRole("tabpanel", { hidden: true })
      .filter((panel) => panel !== screen.getByRole("tabpanel"));
    expect(hiddenPanels).toHaveLength(2);

    for (const panel of hiddenPanels) {
      expect(panel).not.toBeVisible();
      expect(panel).toBeEmptyDOMElement();
    }
  });

  it("must prevent the default action of a key when the tabs handle it", () => {
    const { render } = setUpTest();
    render();

    expect(fireEvent.keyDown(elements.tab("Code"), { key: "ArrowRight" })).toBe(false);
    expect(fireEvent.keyDown(elements.tab("Code"), { key: "a" })).toBe(true);
  });

  it.each([{ altKey: true }, { ctrlKey: true }, { metaKey: true }])(
    "must leave an arrow key alone when it is pressed with %o",
    (modifier) => {
      const { render } = setUpTest();
      render();

      expect(fireEvent.keyDown(elements.tab("Code"), { ...modifier, key: "ArrowLeft" })).toBe(true);
    }
  );

  it("must leave a key alone when the consumer's onKeyDown prevents it", async () => {
    const user = userEvent.setup();
    renderBase(
      <Tabs defaultValue="code">
        <TabList aria-label="Repository">
          <Tab onKeyDown={(event) => event.preventDefault()} value="code">
            Code
          </Tab>
          <Tab value="issues">Issues</Tab>
        </TabList>
      </Tabs>
    );
    await user.tab();

    await user.keyboard("{ArrowRight}");

    expect(elements.tab("Code")).toHaveFocus();
  });

  it("must transition only colours when reduced motion is requested", () => {
    const reducedMotionBlock = tabsCss.match(/@media \(prefers-reduced-motion: reduce\) \{(.*?)\n\}/s)?.[1] ?? "";

    expect(transitionedProperties(reducedMotionBlock)).toEqual(["background-color", "border-color", "color", "none"]);
  });

  it.each([
    { part: "Tab", ui: <Tab value="code">Code</Tab> },
    { part: "TabList", ui: <TabList aria-label="Repository" /> },
    { part: "TabPanel", ui: <TabPanel value="code">Code content</TabPanel> },
  ])("must throw a MissingContextError naming $part when it renders outside Tabs", ({ part, ui }) => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    onTestFinished(() => {
      consoleError.mockRestore();
    });

    expect(() => renderBase(ui)).toThrow(MissingContextError);
    expect(() => renderBase(ui)).toThrow(`${part} must be rendered inside Tabs`);
  });

  it("must reject Tabs when neither value nor defaultValue is given", () => {
    renderBase(
      // @ts-expect-error a tab is always selected, so value or defaultValue is required
      <Tabs>
        <TabList aria-label="Repository">
          <Tab value="code">Code</Tab>
        </TabList>
      </Tabs>
    );
  });

  it("must reject a tab list when it has no name", () => {
    renderBase(
      <Tabs defaultValue="code">
        {/* @ts-expect-error a tab list needs aria-label or aria-labelledby */}
        <TabList>
          <Tab value="code">Code</Tab>
        </TabList>
      </Tabs>
    );
  });

  it("must reject role when it is given to a tab", () => {
    renderBase(
      <Tabs defaultValue="code">
        <TabList aria-label="Repository">
          {/* @ts-expect-error a tab always has the tab role */}
          <Tab role="menuitem" value="code">
            Code
          </Tab>
        </TabList>
      </Tabs>
    );
  });
});

interface RenderOptions {
  activation?: TabsActivation;
  direction?: WritingDirection;
  disabledValue?: string;
  orientation?: TabsOrientation;
  selection?: { defaultValue: string } | { value: string };
}

function setUpTest() {
  const user = userEvent.setup();
  const onValueChange = vi.fn();

  const render = ({
    activation,
    direction,
    disabledValue,
    orientation,
    selection = { defaultValue: "code" },
  }: RenderOptions = {}): void => {
    renderBase(
      <div dir={direction}>
        <Tabs {...selection} activation={activation} onValueChange={onValueChange} orientation={orientation}>
          <TabList aria-label="Repository">
            {repositoryTabs.map(({ label, value }) => (
              <Tab disabled={value === disabledValue} key={value} value={value}>
                {label}
              </Tab>
            ))}
          </TabList>
          {repositoryTabs.map(({ label, value }) => (
            <TabPanel key={value} value={value}>
              {`${label} content`}
            </TabPanel>
          ))}
        </Tabs>
      </div>
    );
  };

  return { onValueChange, render, user };
}

const elements = {
  tab(name: string): HTMLElement {
    return screen.getByRole("tab", { name });
  },
};
