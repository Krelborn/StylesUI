import { describe, expect, it, vi } from "vitest";

import { mergeProps } from "./mergeProps";

describe("mergeProps", () => {
  it("must return the hook's props when the consumer passes none", () => {
    const onFocus = vi.fn();

    expect(mergeProps(undefined, { id: "tip", onFocus })).toEqual({ id: "tip", onFocus });
  });

  it("must keep the consumer's props when the hook does not set them", () => {
    expect(mergeProps({ disabled: true }, { id: "tip" })).toEqual({ disabled: true, id: "tip" });
  });

  it("must run the consumer's handler and then the hook's when both set one", () => {
    const calls: string[] = [];
    const merged = mergeProps(
      {
        onFocus: () => {
          calls.push("consumer");
        },
      },
      {
        onFocus: () => {
          calls.push("hook");
        },
      }
    );

    merged.onFocus();

    expect(calls).toEqual(["consumer", "hook"]);
  });

  it("must list the hook's id before the consumer's when both set aria-describedby", () => {
    expect(mergeProps({ "aria-describedby": "note" }, { "aria-describedby": "tip" })).toEqual({
      "aria-describedby": "tip note",
    });
  });

  it("must list the hook's id before the consumer's when both set aria-labelledby", () => {
    expect(mergeProps({ "aria-labelledby": "note" }, { "aria-labelledby": "tip" })).toEqual({
      "aria-labelledby": "tip note",
    });
  });

  it("must merge style objects with the hook's properties winning when both set style", () => {
    expect(mergeProps({ style: { color: "red", inlineSize: "1rem" } }, { style: { color: "blue" } })).toEqual({
      style: { color: "blue", inlineSize: "1rem" },
    });
  });

  it("must keep both anchor names when both styles set anchorName", () => {
    expect(
      mergeProps({ style: { anchorName: "--sui-overlay-popover" } }, { style: { anchorName: "--sui-overlay-tip" } })
    ).toEqual({ style: { anchorName: "--sui-overlay-tip, --sui-overlay-popover" } });
  });

  it("must keep the consumer's value when the hook's value is undefined", () => {
    const hookProps: { "aria-describedby"?: string } = { "aria-describedby": undefined };

    expect(mergeProps({ "aria-describedby": "note" }, hookProps)).toEqual({ "aria-describedby": "note" });
  });

  it("must take the hook's value when both set any other prop", () => {
    expect(mergeProps({ id: "own" }, { id: "tip" })).toEqual({ id: "tip" });
  });

  it("must reject a consumer prop when its type differs from the hook's", () => {
    // @ts-expect-error onFocus must be a function, as the hook's is
    const merged = mergeProps({ onFocus: "focus" }, { onFocus: () => undefined });

    expect(merged.onFocus).toBeTypeOf("function");
  });
});
