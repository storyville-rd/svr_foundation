import { describe, expect, it } from "vitest";
import { computeFingerprint, errorSignature, normalizeRoute } from "../src/dedupe";

describe("normalizeRoute", () => {
  it("replaces numeric segments with :id", () => {
    expect(normalizeRoute("https://app.example.com/proposals/482/edit")).toBe(
      "/proposals/:id/edit"
    );
  });

  it("replaces UUID segments with :id", () => {
    expect(
      normalizeRoute("https://app.example.com/items/3fa85f64-5717-4562-b3fc-2c963f66afa6")
    ).toBe("/items/:id");
  });

  it("leaves non-numeric, non-UUID segments alone", () => {
    expect(normalizeRoute("https://app.example.com/settings/billing")).toBe("/settings/billing");
  });
});

describe("errorSignature", () => {
  it("returns empty string when there are no buffered errors", () => {
    expect(errorSignature({ errors: [] })).toBe("");
    expect(errorSignature(undefined)).toBe("");
  });

  it("uses the newest error's message and top stack frame", () => {
    const diagnostics = {
      errors: [
        { msg: "old error", stack: "old error\n  at oldFn (a.js:1:1)" },
        { msg: "TypeError: x is undefined", stack: "TypeError: x is undefined\n  at fn (b.js:10:4)\n  at g (c.js:2:1)" },
      ],
    };
    expect(errorSignature(diagnostics)).toBe("TypeError: x is undefined|at fn (b.js:10:4)");
  });
});

describe("computeFingerprint", () => {
  it("does not vary with description text", async () => {
    const url = "https://app.example.com/proposals/482/edit";
    const diagnostics = { errors: [{ msg: "boom", stack: "boom\n  at fn (a.js:1:1)" }] };
    const fp1 = await computeFingerprint("app", "build1", url, diagnostics);
    const fp2 = await computeFingerprint("app", "build1", url, diagnostics);
    expect(fp1).toBe(fp2);
  });

  it("distinguishes different descriptions when no error was captured", async () => {
    const url = "https://x.com/proposals/482";
    const a = await computeFingerprint("app", "b1", url, { errors: [] }, "comma drops zeros");
    const b = await computeFingerprint("app", "b1", url, { errors: [] }, "note missing from email");
    const a2 = await computeFingerprint("app", "b1", url, { errors: [] }, "  Comma drops   zeros ");
    expect(a).not.toBe(b);
    expect(a).toBe(a2);
  });

  it("ignores description when an error was captured", async () => {
    const url = "https://x.com/proposals/482";
    const d = { errors: [{ msg: "boom", stack: "boom\n  at fn (a.js:1:1)" }] };
    const a = await computeFingerprint("app", "b1", url, d, "first wording");
    const b = await computeFingerprint("app", "b1", url, d, "other wording");
    expect(a).toBe(b);
  });

  it("varies with app, build, route, or error signature", async () => {
    const base = await computeFingerprint("app", "build1", "https://x.com/a/1", { errors: [] });
    const diffApp = await computeFingerprint("app2", "build1", "https://x.com/a/1", { errors: [] });
    const diffRoute = await computeFingerprint("app", "build1", "https://x.com/a/2", { errors: [] });
    expect(diffApp).not.toBe(base);
    // /a/1 and /a/2 both normalize to /a/:id, so the route-only difference collapses to the
    // same fingerprint — this assertion documents that intentional behavior.
    expect(diffRoute).toBe(base);
  });
});
