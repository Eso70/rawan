import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Button,
  IconButton,
  TextInput,
  Checkbox,
  Radio,
  Select,
  FieldError,
} from "../src/components/ui/controls.ts";
const render = (component, props, children) =>
  renderToStaticMarkup(createElement(component, props, children));
test("shared buttons keep native submit intent, labels and caller styling", () => {
  assert.match(
    render(Button, { className: "existing-action" }, "Continue"),
    /type="button"/,
  );
  assert.match(
    render(
      Button,
      { type: "submit", className: "existing-action", disabled: true },
      "Continue",
    ),
    /disabled=""/,
  );
  assert.match(
    render(
      Button,
      { type: "submit", className: "existing-action" },
      "Continue",
    ),
    /class="existing-action" type="submit"/,
  );
});
test("a loading button blocks repeat interaction and exposes its current state", () => {
  const html = render(
    Button,
    { loading: true, loadingLabel: "Saving…", type: "submit" },
    "Continue",
  );
  assert.match(html, /disabled=""/);
  assert.match(html, /aria-busy="true"/);
  assert.match(html, />Saving…<\/button>/);
  assert.doesNotMatch(html, /loadingLabel|loading=/);
});
test("icon actions have an explicit accessible name without an extra wrapper", () => {
  const html = render(
    IconButton,
    { label: "Show password", "aria-pressed": false },
    createElement("svg", { "aria-hidden": true }),
  );
  assert.match(html, /aria-label="Show password"/);
  assert.match(html, /aria-pressed="false"/);
  assert.match(html, /<button/);
  assert.doesNotMatch(html, / label=/);
});
test("text controls preserve validation, autocomplete and error associations", () => {
  const html = render(TextInput, {
    id: "email",
    type: "email",
    name: "email",
    required: true,
    maxLength: 254,
    autoComplete: "email",
    "aria-invalid": true,
    "aria-describedby": "email-error",
  });
  for (const expected of [
    'type="email"',
    'required=""',
    'maxLength="254"',
    'autoComplete="email"',
    'aria-invalid="true"',
    'aria-describedby="email-error"',
  ])
    assert.ok(html.includes(expected), expected);
});
test("native selections preserve grouping, disabled and checked state", () => {
  assert.match(
    render(Radio, { name: "purpose", value: "both", defaultChecked: true }),
    /type="radio".*checked=""/,
  );
  assert.match(
    render(Checkbox, { disabled: true, defaultChecked: true }),
    /disabled="".*type="checkbox".*checked=""/,
  );
});
test("select retains native options and a real selected value", () => {
  const html = render(
    Select,
    { id: "language", defaultValue: "en" },
    createElement("option", { value: "en" }, "English"),
  );
  assert.match(html, /<select id="language">/);
  assert.match(html, /<option value="en" selected="">English<\/option>/);
});
test("field errors retain focus targets and announced native content", () => {
  const html = render(
    FieldError,
    { id: "setup-error", tabIndex: -1, className: "existing-error" },
    "Choose a purpose.",
  );
  assert.match(html, /id="setup-error"/);
  assert.match(html, /tabindex="-1"/);
  assert.match(html, /role="alert"/);
  assert.match(html, />Choose a purpose\.<\/p>/);
});
