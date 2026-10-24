# JobTrail

A small app to keep track of the places I've applied. I add an entry when I send
an application, change its status when I hear back, and leave a short note about
what to do next.

Built with TypeScript and plain DOM (no framework) so I could practise typing a
real project. Vite for the dev server and build, Vitest for the tests.

## Features

- Add an application (company, role, status, date, optional notes)
- Edit and delete entries
- Search by company or role, filter by status
- Summary counters for each status at the top
- Everything saved in `localStorage`, so a refresh keeps the data
- Broken or invalid saved data is ignored instead of crashing the page
- Responsive layout, light/dark theme follows the OS setting
- Keyboard friendly, labelled inputs, visible focus outlines

## How to run

```bash
npm install
npm run dev      # opens http://localhost:5173
```

## Tests and build

```bash
npm test         # runs the Vitest tests
npm run build    # type-checks with tsc, then builds to dist/
npm run preview  # serves the built version locally
```

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. On Vercel, "Add New Project" and import the repository.
3. Vercel picks up `vercel.json` (build command `npm run build`, output `dist`).
4. Deploy.

Any static host works the same way: upload the contents of `dist/`.

## Folder structure

```
src/
  types.ts       Status type, Application interface, STATUSES list
  logic.ts       pure functions: filter, counts, create/update/remove
  storage.ts     localStorage load/save plus validation of stored data
  dom.ts         small typed querySelector helper
  main.ts        state, event listeners, wiring everything together
  style.css      all the styles
  ui/
    form.ts      the add/edit dialog
    list.ts      summary and the application cards
tests/
  logic.test.ts  tests for filterApplications, countByStatus, parseApplications
LEARN.md         notes on how the project works, for me to study later
```

## Decisions I made

- **No live preview as you type.** The list re-renders on every change of the
  state array instead of doing fine-grained DOM updates. Simpler to follow.
- **Delete uses `window.confirm`.** A custom confirmation dialog would be nicer
  but it is a lot more code for a small personal app.
- **Dates are stored as `YYYY-MM-DD` strings.** That is what `<input type="date">`
  gives, and string comparison sorts them correctly.
- **Old data that fails validation is dropped, not repaired.** The rest still loads.
- **Notes are plain text.** `textContent` is used everywhere, so pasted HTML is
  never injected into the page.

## What I learned

- How to keep one array as the source of truth in a no-framework app, and just
  re-render after every change.
- Why separating pure logic from DOM code makes testing easy: the tests never
  touch the browser.
- `unknown` + a type guard is how you safely handle data you did not create
  (anything read from `localStorage`).
- Event delegation: one listener on the list handles every Edit/Delete button.

## What I'd improve

- Add a "clear all" button with an undo snackbar.
- Show a small "saved" indicator after writing to localStorage.
- Group entries by month, or sort by status.
- Escape the dialog on overlay click (currently only the Cancel button and Esc
  close it — Esc works because it is a native `<dialog>`).
