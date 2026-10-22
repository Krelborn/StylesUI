import { afterEach, describe, expect, it } from "vitest";

import { itemText } from "./itemText";

describe("itemText", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("must read the elements the item's aria-labelledby names when it names some", () => {
    document.body.innerHTML = `
      <button aria-labelledby="first second" role="menuitem">
        <span id="first">Move</span> <span id="second">to</span> <span>Put it elsewhere</span> ⌘M
      </button>
    `;

    expect(itemText(document.querySelector("button") as HTMLElement)).toBe("Move to");
  });

  it("must read the item's own text when its aria-labelledby names nothing in the document", () => {
    document.body.innerHTML = `<button aria-labelledby="missing" role="menuitem">Archive</button>`;

    expect(itemText(document.querySelector("button") as HTMLElement)).toBe("Archive");
  });

  it("must read the item's own text when it has no aria-labelledby", () => {
    document.body.innerHTML = `<button role="menuitem">Archive</button>`;

    expect(itemText(document.querySelector("button") as HTMLElement)).toBe("Archive");
  });
});
