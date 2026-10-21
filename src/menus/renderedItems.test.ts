import { describe, expect, it } from "vitest";

import { renderedItems } from "./renderedItems";

describe("renderedItems", () => {
  it("must return every kind of item in document order when the menu holds them", () => {
    const menu = menuOf(`
      <button role="menuitem">Edit</button>
      <div role="group">
        <button role="menuitemcheckbox">Show archived</button>
        <button role="menuitemradio">Name</button>
      </div>
    `);

    expect(renderedItems(menu).map((item) => item.textContent)).toEqual(["Edit", "Show archived", "Name"]);
  });

  it("must leave out the items of a nested menu when the menu holds one", () => {
    const menu = menuOf(`
      <div role="none">
        <button role="menuitem">Move to</button>
        <div role="menu"><button role="menuitem">Inbox</button></div>
      </div>
      <button role="menuitem">Delete</button>
    `);

    expect(renderedItems(menu).map((item) => item.textContent)).toEqual(["Move to", "Delete"]);
  });

  it("must leave out hidden and inert items when the menu holds them", () => {
    const menu = menuOf(`
      <button role="menuitem">Edit</button>
      <button hidden role="menuitem">Rename</button>
      <div inert><button role="menuitem">Archive</button></div>
    `);

    expect(renderedItems(menu).map((item) => item.textContent)).toEqual(["Edit"]);
  });

  it("must return nothing when the menu is empty", () => {
    expect(renderedItems(menuOf(""))).toEqual([]);
  });
});

function menuOf(html: string): HTMLElement {
  const menu = document.createElement("div");
  menu.setAttribute("role", "menu");
  menu.innerHTML = html;

  return menu;
}
