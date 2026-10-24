import type { Application, Status } from "../types";
import { getElement } from "../dom";

export interface FormValues {
  company: string;
  role: string;
  status: Status;
  dateApplied: string;
  notes: string;
}

export interface FormDialog {
  open: (application: Application | null) => void;
  close: () => void;
}

export interface FormOptions {
  // editingId is null for a new application, otherwise the id of the one being edited.
  onSubmit: (values: FormValues, editingId: string | null) => void;
}

export function createFormDialog(options: FormOptions): FormDialog {
  const dialog = getElement<HTMLDialogElement>("#form-dialog");
  const form = getElement<HTMLFormElement>("#application-form");
  const title = getElement<HTMLHeadingElement>("#dialog-title");
  const cancelButton = getElement<HTMLButtonElement>("#cancel-button");

  const companyInput = getElement<HTMLInputElement>("#company-input");
  const roleInput = getElement<HTMLInputElement>("#role-input");
  const statusSelect = getElement<HTMLSelectElement>("#status-select");
  const dateInput = getElement<HTMLInputElement>("#date-input");
  const notesInput = getElement<HTMLTextAreaElement>("#notes-input");

  const errorElements = {
    company: getElement<HTMLParagraphElement>("#company-error"),
    role: getElement<HTMLParagraphElement>("#role-error"),
    date: getElement<HTMLParagraphElement>("#date-error")
  };

  let editingId: string | null = null;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const values: FormValues = {
      company: companyInput.value,
      role: roleInput.value,
      status: statusSelect.value as Status,
      dateApplied: dateInput.value,
      notes: notesInput.value
    };

    const problems = validate(values);
    errorElements.company.hidden = !problems.includes("company");
    errorElements.role.hidden = !problems.includes("role");
    errorElements.date.hidden = !problems.includes("date");

    companyInput.setAttribute("aria-invalid", String(problems.includes("company")));
    roleInput.setAttribute("aria-invalid", String(problems.includes("role")));
    dateInput.setAttribute("aria-invalid", String(problems.includes("date")));

    if (problems.length > 0) {
      return;
    }

    options.onSubmit(values, editingId);
    close();
  });

  cancelButton.addEventListener("click", close);

  function close(): void {
    if (dialog.open) {
      dialog.close();
    }
  }

  return {
    open(application: Application | null) {
      editingId = application === null ? null : application.id;

      form.reset();
      title.textContent = application === null ? "Add application" : "Edit application";

      if (application !== null) {
        companyInput.value = application.company;
        roleInput.value = application.role;
        statusSelect.value = application.status;
        dateInput.value = application.dateApplied;
        notesInput.value = application.notes;
      } else {
        // Default to today so adding an entry takes fewer clicks.
        dateInput.value = todayAsIsoDate();
      }

      errorElements.company.hidden = true;
      errorElements.role.hidden = true;
      errorElements.date.hidden = true;
      companyInput.removeAttribute("aria-invalid");
      roleInput.removeAttribute("aria-invalid");
      dateInput.removeAttribute("aria-invalid");

      dialog.showModal();
      companyInput.focus();
    },
    close
  };
}

// Returns the names of the invalid fields. Empty array means the form is fine.
export function validate(values: FormValues): string[] {
  const problems: string[] = [];

  if (values.company.trim() === "") {
    problems.push("company");
  }
  if (values.role.trim() === "") {
    problems.push("role");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.dateApplied)) {
    problems.push("date");
  }

  return problems;
}

export function todayAsIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}
