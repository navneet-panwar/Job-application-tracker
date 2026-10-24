import { STATUSES, isStatus, type Application, type ApplicationInput, type StatusFilter } from "./types";
import {
  createApplication,
  filterApplications,
  removeApplication,
  updateApplication
} from "./logic";
import { loadApplications, saveApplications } from "./storage";
import { getElement } from "./dom";
import { createFormDialog, type FormValues } from "./ui/form";
import { renderList, renderSummary, type ListElements } from "./ui/list";

// ----- state -----
// The app has one source of truth: this array. Every action changes it,
// saves it and then re-renders. No hidden copies anywhere else.

let applications: Application[] = loadApplications();
let search = "";
let statusFilter: StatusFilter = "all";

// ----- elements -----

const elements: ListElements = {
  summary: getElement<HTMLUListElement>("#summary"),
  list: getElement<HTMLUListElement>("#application-list"),
  count: getElement<HTMLParagraphElement>("#list-count"),
  empty: getElement<HTMLParagraphElement>("#empty-message")
};

const addButton = getElement<HTMLButtonElement>("#add-button");
const searchInput = getElement<HTMLInputElement>("#search-input");
const statusSelect = getElement<HTMLSelectElement>("#status-filter");

// The form calls this with cleaned-up values; we decide create vs update, then save and re-render.
function saveFromForm(values: FormValues, editingId: string | null): void {
  const data: ApplicationInput = {
    company: values.company.trim(),
    role: values.role.trim(),
    status: values.status,
    dateApplied: values.dateApplied,
    notes: values.notes.trim()
  };

  if (editingId === null) {
    applications = [createApplication(data), ...applications];
  } else {
    applications = updateApplication(applications, editingId, data);
  }

  update();
}

const formDialog = createFormDialog({ onSubmit: saveFromForm });

// Fill the status dropdowns from STATUSES so the list only lives in one place.
function fillStatusOptions(): void {
  for (const status of STATUSES) {
    const option = document.createElement("option");
    option.value = status;
    option.textContent = status;
    statusSelect.append(option);
  }
}

// ----- events -----

addButton.addEventListener("click", () => formDialog.open(null));

searchInput.addEventListener("input", () => {
  search = searchInput.value;
  render();
});

statusSelect.addEventListener("change", function handleStatusChange() {
  // The <select> gives us a plain string, so narrow it back to our union type.
  const value = statusSelect.value;
  statusFilter = value === "all" || isStatus(value) ? value : "all";
  render();
});

// Event delegation: one listener on the list handles every Edit and Delete button.
elements.list.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const button = target.closest<HTMLButtonElement>("button[data-action]");
  const card = target.closest<HTMLElement>(".card");
  if (button === null || card === null) {
    return;
  }

  const id = card.dataset.id;
  if (id === undefined) {
    return;
  }

  if (button.dataset.action === "edit") {
    const application = applications.find((app) => app.id === id);
    if (application !== undefined) {
      formDialog.open(application);
    }
  }

  if (button.dataset.action === "delete") {
    deleteApplication(id);
  }
});

function deleteApplication(id: string): void {
  const application = applications.find((app) => app.id === id);
  if (application === undefined) {
    return;
  }

  const ok = window.confirm(`Delete the application for ${application.company}?`);
  if (!ok) {
    return;
  }

  applications = removeApplication(applications, id);
  update();
}

// ----- rendering -----

function render(): void {
  const visible = filterApplications(applications, search, statusFilter);
  renderSummary(elements.summary, applications);
  renderList(elements, visible, search, statusFilter);
}

// Saves first, then renders. Used after any change to `applications`.
function update(): void {
  saveApplications(applications);
  render();
}



// ----- start -----

fillStatusOptions();
render();
