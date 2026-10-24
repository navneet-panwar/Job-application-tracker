import type { Application, Status, StatusFilter } from "../types";
import { countByStatus, hasActiveFilters } from "../logic";

// The handful of elements the renderer touches. main.ts builds this object once
// and passes it in, so this file never has to search the document itself.
export interface ListElements {
  summary: HTMLUListElement;
  list: HTMLUListElement;
  count: HTMLParagraphElement;
  empty: HTMLParagraphElement;
}

// Short label for each status, used in the summary cards.
const STATUS_LABELS: Record<Status, string> = {
  Applied: "Applied",
  Interview: "Interview",
  Offer: "Offer",
  Rejected: "Rejected"
};

export function renderSummary(container: HTMLUListElement, applications: Application[]): void {
  const counts = countByStatus(applications);
  container.replaceChildren();

  const statuses = Object.keys(counts) as Status[];
  for (const status of statuses) {
    const item = document.createElement("li");
    item.className = `summary-item status-${status.toLowerCase()}`;

    const value = document.createElement("strong");
    value.textContent = String(counts[status]);

    const label = document.createElement("span");
    label.textContent = STATUS_LABELS[status];

    item.append(value, label);
    container.append(item);
  }
}

export function renderList(
  elements: ListElements,
  applications: Application[],
  search: string,
  status: StatusFilter
): void {
  elements.list.replaceChildren();
  applications.forEach((app) => elements.list.append(createCard(app)));

  elements.count.textContent =
    applications.length === 1 ? "1 application shown" : `${applications.length} applications shown`;

  const filtering = hasActiveFilters(search, status);
  elements.empty.hidden = applications.length > 0;
  elements.empty.textContent = filtering
    ? "Nothing matches these filters. Try clearing the search."
    : "No applications yet. Click \"+ Add application\" to start your trail.";

  // Show the empty message after the list instead of inside it.
  elements.list.hidden = applications.length === 0;
}

function createCard(app: Application): HTMLLIElement {
  const card = document.createElement("li");
  card.className = "card";
  card.dataset.id = app.id;

  const header = document.createElement("div");
  header.className = "card-header";

  const titles = document.createElement("div");
  const role = document.createElement("h3");
  role.className = "card-role";
  role.textContent = app.role;

  const company = document.createElement("p");
  company.className = "card-company";
  company.textContent = app.company;

  titles.append(role, company);

  const badge = document.createElement("span");
  badge.className = `badge status-${app.status.toLowerCase()}`;
  badge.textContent = app.status;

  header.append(titles, badge);

  const date = document.createElement("p");
  date.className = "card-date";
  date.textContent = `Applied on ${formatDate(app.dateApplied)}`;

  card.append(header, date);

  if (app.notes !== "") {
    const notes = document.createElement("p");
    notes.className = "card-notes";
    notes.textContent = app.notes;
    card.append(notes);
  }

  const actions = document.createElement("div");
  actions.className = "card-actions";

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "secondary";
  editButton.dataset.action = "edit";
  editButton.textContent = "Edit";
  editButton.setAttribute("aria-label", `Edit application for ${app.company}`);

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "danger";
  deleteButton.dataset.action = "delete";
  deleteButton.textContent = "Delete";
  deleteButton.setAttribute("aria-label", `Delete application for ${app.company}`);

  actions.append(editButton, deleteButton);
  card.append(actions);

  return card;
}

// "2026-03-14" -> "14 Mar 2026". Using the browser's date formatting keeps it simple.
export function formatDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}
