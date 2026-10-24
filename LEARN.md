# LEARN.md — studying JobTrail

This is my own study guide for the project. It follows the way I actually read
code: start at the entry point, follow the clicks.

---

## 1. Map of the project

| File                  | What it does                                                                                                                                                  | Read it when you want to...               |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `index.html`          | The page structure: header, summary list, search form, cards list, and the hidden `<dialog>` form.                                                            | see where every element id comes from     |
| `src/types.ts`        | `Status` union type, `Application` interface, `STATUSES` array, `isStatus` type guard.                                                                        | change the list of statuses               |
| `src/logic.ts`        | Pure functions: `createApplication`, `filterApplications`, `countByStatus`, `updateApplication`, `removeApplication`, `hasActiveFilters`. No DOM, no storage. | understand or test the rules              |
| `src/storage.ts`      | Reads and writes `localStorage`; `parseApplications` validates anything it finds.                                                                             | debug "my data disappeared"               |
| `src/dom.ts`          | `getElement<T>(selector)` — a typed `document.querySelector` that throws if the element is missing.                                                           | see why there are no `!` marks everywhere |
| `src/ui/form.ts`      | The add/edit `<dialog>`. Fills it in, validates it, and calls `onSubmit`.                                                                                     | change the form fields                    |
| `src/ui/list.ts`      | Draws the summary counters and the application cards.                                                                                                         | change how a card looks                   |
| `src/main.ts`         | State (`applications`, `search`, `statusFilter`), event listeners, `render()` and `update()`.                                                                 | follow a click from start to finish       |
| `src/style.css`       | All styles, colours as CSS variables, dark mode block, mobile media query.                                                                                    | restyle                                   |
| `tests/logic.test.ts` | Vitest tests for filtering, counting and parsing stored data.                                                                                                 | learn how tests are written               |
| `vite.config.ts`      | Vite + the Vitest settings (`tests/**/*.test.ts`).                                                                                                            | add a test file                           |
| `vercel.json`         | Tells Vercel to run `npm run build` and serve `dist`.                                                                                                         | deploy                                    |

The flow in one sentence: `index.html` gives ids, `main.ts` grabs those ids,
holds the data, listens for events, and calls `ui/` functions to redraw.

---

## 2. How each feature works

### Add an application

- `index.html` → `#add-button` and the `#form-dialog` element.
- `main.ts` → `addButton.addEventListener("click", …)` calls `formDialog.open(null)`.
- `src/ui/form.ts` → `open()` clears the form, sets today's date
  (`todayAsIsoDate`), then `dialog.showModal()`.
- Pressing Save fires the `submit` listener in `form.ts`: it collects the values,
  runs `validate(values)`, and if everything is fine calls
  `options.onSubmit(values, editingId)`. `editingId` is `null` for a new entry.
- `main.ts` → `saveFromForm` builds the object and calls `createApplication`
  (in `logic.ts`) which trims text and adds an id with `crypto.randomUUID()`.
  The new entry goes at the front of the array, then `update()` runs.
- `update()` = `saveApplications(applications)` (storage) + `render()`.

### Edit

- Every card has an Edit button with `data-action="edit"`. The card has `data-id`.
- `main.ts` has **one** click listener on the whole list (event delegation). It
  finds the closest `.card` and `button[data-action]`, reads the id, finds the
  application in the array and opens the dialog with it.
- `form.ts` remembers that id in the `editingId` variable, and `main.ts` →
  `saveFromForm` calls `updateApplication` (in `logic.ts`), which returns a new
  array with the matching item replaced.

### Delete

- Same click listener, `data-action="delete"` → `deleteApplication(id)` in
  `main.ts`: asks with `window.confirm`, then `removeApplication` returns a new
  array without that item, then `update()`.

### Search and filter

- `#search-input` → `input` event stores the text in the `search` variable and
  calls `render()`. `#status-filter` does the same in a `change` event, after
  narrowing the raw `select.value` string with `isStatus`.
- `render()` calls `filterApplications(applications, search, statusFilter)` and
  passes the visible list to `renderList` in `src/ui/list.ts`.
- `filterApplications` lowercases the search, checks company and role with
  `includes`, checks the status, then sorts newest first.

### Summary counters

- `render()` calls `renderSummary(elements.summary, applications)` with **all**
  applications, not the filtered ones — the summary should not change when you
  search.
- `countByStatus` (in `logic.ts`) builds `{ Applied: 2, Interview: 1, … }`.
  `renderSummary` loops over `Object.keys(counts)` and creates one `<li>` per
  status.

### Saving and bad data

- `saveApplications` writes `JSON.stringify(applications)` under the key
  `"jobtrail.applications"`.
- On start, `main.ts` does `let applications = loadApplications()`, which calls
  `parseApplications`. That function `JSON.parse`s inside a `try/catch`, checks
  the result is an array, and drops every item that fails `isValidApplication`.
  Missing data, broken JSON and wrong shapes all end up as `[]` or a shorter list
  — never a crash.

### Accessibility bits

- Every input has a `<label for="…">` pointing at its id.
- The dialog is a real `<dialog>` element, so focus is trapped and Esc closes it.
- Errors are `<p>` elements right under their input. They are shown/hidden and
  the input gets `aria-invalid` while the message is visible.
- `:focus-visible` outlines are set in `style.css` for inputs, selects, textareas
  and buttons.
- `#list-count` has `aria-live="polite"`, so screen readers announce how many
  results there are after searching.
- "Delete" is red _and_ says "Delete" — colour is never the only signal.

---

## 3. TypeScript syntax used here

**Union type** — a value can only be one of a few exact strings:

```ts
export type Status = "Applied" | "Interview" | "Offer" | "Rejected";
```

`const s: Status = "Done"` is an error, which is exactly what we want.

**Interface** — the shape of an object:

```ts
export interface Application {
  id: string;
  company: string;
  // ...
}
```

**`Omit`** — make a new type out of an existing one minus some fields:

```ts
export type ApplicationInput = Omit<Application, "id">;
```

Useful because the form never supplies an id.

**Literal type with a wider alternative**:

```ts
export type StatusFilter = Status | "all";
```

**Type guard (`value is Status`)** — a function TypeScript trusts to narrow a
type after it returns `true`:

```ts
export function isStatus(value: unknown): value is Status {
  return STATUSES.includes(value as Status);
}
```

After `if (isStatus(x))`, inside that `if`, `x` is `Status`.

**`unknown` vs `any`** — `unknown` means "I don't know what this is", but you
must check before using it. `any` means "turn off checking", and the project
does not use it anywhere.

**`Record<Key, Value>`** — an object whose keys are all from a type:

```ts
const counts: Record<Status, number> = { Applied: 0 /* ... */ };
```

Now `counts.Applied` is a `number` and `counts.Foo` is a compile error.

**Generics in a function**:

```ts
export function getElement<T extends Element>(selector: string): T;
```

You pass the HTML element type in the angle brackets
(`getElement<HTMLInputElement>("#company-input")`) and get `.value` back with the
right type.

**`Partial<T>` in tests** — a version of a type where every field is optional:

```ts
function makeApplication(overrides: Partial<Application>): Application {
  return { id: "id-1", /* ...required fields... */, ...overrides };
}
```

**Type-only imports**:

```ts
import type { Application } from "./types";
```

Types disappear after compilation, so this tells the bundler it can skip the import.

**Casts with `as`** — a `<select>` value is a plain `string`. It is a promise, so it is used
only right after a check (see `main.ts`, `statusSelect` listener).

**Optional chaining `?.`** — in tests, `result[0]?.company` does not crash if the
array is empty.

**Strict-mode helpers** — `noUncheckedIndexedAccess` makes `array[0]` possibly
`undefined`, which is why `countByStatus` writes `(counts[app.status] ?? 0) + 1`.

---

## 4. Ten interview-style questions about this project

**1. What is a closure, and where could you use one here?**
A closure is a function that keeps access to variables from where it was
defined, even after that code finished running. In `src/ui/form.ts`,
`createFormDialog()` defines local variables (`editingId`, the inputs) and returns
`open`/`close` functions that still use them. In a project with frameworks I
could also keep `editingId` in a closure created per row.

**2. How does a DOM event listener work, and why `addEventListener` instead of `onclick=`?**
`addEventListener("click", handler)` registers a function that the browser
calls when the event fires. It lets you add several listeners to one element,
remove them with `removeEventListener`, and keeps JavaScript out of the HTML.

**3. What is event delegation, and why use it here?**
Instead of adding a listener to every Edit and Delete button, `main.ts` puts one
listener on `#application-list`. Clicks bubble up from the button to the list, and
`event.target.closest("button[data-action]")` finds which button was pressed. One
listener keeps working even after re-rendering all the cards — a listener on a
button that was just replaced would be lost.

**4. Why does the search listener use `"input"` and the dropdown use `"change"`?**
`input` fires on every keystroke in a text field. `change` fires when a
`<select>` value is actually committed. Using the right event avoids firing work
you don't need.

**5. How does `localStorage` work, and what are its limits?**
It stores key/value strings per site that survive reloads, with roughly a 5 MB
limit, synchronously, and only for that browser. `JSON.stringify`/`JSON.parse`
convert between objects and strings. It is not a database: no queries, no
sharing between devices, and any user can edit or clear it.

**6. Why do you validate data read from `localStorage`?**
Because it is external input. It could be old data from a previous version,
edited by hand in DevTools, or partially written. `parseApplications` checks
every object with `isValidApplication` and drops the items that do not match, so
one bad entry cannot break the page.

**7. Why are `filterApplications` and `countByStatus` in their own file?**
They are pure functions — no DOM, no storage, same input always gives the same
output. That makes them trivial to test with Vitest, and it keeps the rules of
the app separate from the parts that touch the browser.

**8. What is the difference between `unknown`, `any` and a union type?**
`any` disables type checking. `unknown` accepts anything but needs a check before
use. A union type lists the exact allowed values. We use `unknown` at the
boundaries (`JSON.parse`, DOM values) and unions everywhere inside the app.

**9. Why does the app re-render the whole list instead of updating one card?**
Because the state is one array and every change goes through `render()`. It is a
few lines of code and impossible to get out of sync. It would get slow with
thousands of cards, which is when you would render only the changed item or
introduce a framework.

**10. What does `strict` mode in TypeScript change, and did it catch anything?**
It turns on `strictNullChecks` (so `document.querySelector` returns
`Element | null` and you must handle `null`), stricter `this`, and stricter
function types. In this project `noUncheckedIndexedAccess` (on top of strict)
forced the `?? 0` in `countByStatus`, and `strictNullChecks` is why `getElement`
exists. The `Status` union caught a bug where a raw `select.value` string was
assigned to `StatusFilter`.

---

## 5. Suggested reading order

1. `README.md` (what it is), then run `npm run dev` and try it.
2. `index.html` — read the ids. Everything else hangs off them.
3. `src/types.ts` — two minutes, but everything refers to it.
4. `src/logic.ts` — the rules, easiest to understand in isolation.
5. `tests/logic.test.ts` — run `npm test` and read each test next to its function.
6. `src/storage.ts` — `parseApplications` is the most "real world" function here.
7. `src/ui/list.ts` and `src/ui/form.ts` — barely any TypeScript, mostly DOM.
8. `src/main.ts` — last, because now every name it uses is familiar. Follow one
   click from listener to `render()`.
9. `src/style.css` — the custom properties at the top and the dark-mode block.

## 6. Five exercises to try

1. **Add a "Ghosted" status.** Change `Status` in `src/types.ts`, add it to
   `STATUSES`, add a colour pair in `style.css`, and fix whatever `tsc` complains
   about. That error list is the compiler doing your work.
2. **Sort oldest first.** Add a `newestFirst` boolean to `main.ts` and flip the
   comparator in `filterApplications` based on it. Add a test for both orders.
3. **Filter by month.** Add a second `<select>` with months and extend
   `filterApplications` with a `month` argument (`"2026-03"`). Keep it pure so it
   can be tested.
4. **Show the total at the bottom.** Add a line like "Total: 12" next to the
   summary using `applications.length`. Try it with `filterApplications` too, so
   it shows the visible count.
5. **Import/export.** Write `exportApplications()` that downloads a JSON file
   using `Blob` and an `<a download>`, and an import that reads a file with
   `File.text()` and passes it through `parseApplications` before merging.
