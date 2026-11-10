import { describe, expect, it } from "vitest";
import { redactDiagnostics, redactText } from "../src/redact";

describe("redactText", () => {
  it("redacts a Luhn-valid card number", () => {
    expect(redactText("my card is 4111 1111 1111 1111 please help")).toBe(
      "my card is [redacted:card] please help"
    );
  });

  it("does not redact a Luhn-invalid digit run (e.g. an order number)", () => {
    const text = "order number 1234567890123 was never fulfilled";
    expect(redactText(text)).toBe(text);
  });

  it("redacts an SSN", () => {
    expect(redactText("ssn 123-45-6789 on file")).toBe("ssn [redacted:ssn] on file");
  });

  it("redacts a bearer token", () => {
    expect(redactText("Authorization: Bearer abc123XYZ.def456")).toBe(
      "Authorization: [redacted:token]"
    );
  });

  it("redacts common API key prefixes", () => {
    expect(redactText("key is sk_live_abcdefghijklmnop")).toBe("key is [redacted:token]");
    expect(redactText("token ghp_abcdefghijklmnopqrstuv")).toBe("token [redacted:token]");
  });

  it("does not mangle normal prose", () => {
    const text = "Clicking Save on the proposal page shows a spinner forever and nothing saves.";
    expect(redactText(text)).toBe(text);
  });
});

describe("redactDiagnostics", () => {
  it("fully redacts values of sensitive-looking keys", () => {
    const input = { apiKey: "sk_live_abcdefghijklmnop", note: "fine" };
    expect(redactDiagnostics(input)).toEqual({ apiKey: "[redacted:field]", note: "fine" });
  });

  it("recurses into nested objects and arrays", () => {
    const input = { errors: [{ msg: "card 4111111111111111 declined" }] };
    expect(redactDiagnostics(input)).toEqual({ errors: [{ msg: "card [redacted:card] declined" }] });
  });
});
