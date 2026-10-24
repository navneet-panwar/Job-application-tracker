import { isStatus, type Application } from "./types";

const STORAGE_KEY = "jobtrail.applications";

// Checks that an unknown value has the shape of an Application.
// Anything coming back from localStorage could be old data or something a user edited by hand,
// so every field is checked before we let it into the app.
export function isValidApplication(value: unknown): value is Application {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    typeof item.id === "string" &&
    item.id.length > 0 &&
    typeof item.company === "string" &&
    typeof item.role === "string" &&
    isStatus(item.status) &&
    typeof item.dateApplied === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(item.dateApplied) &&
    typeof item.notes === "string"
  );
}

// Turns whatever we found in storage into a clean array of applications.
// Invalid items are dropped instead of crashing the whole app.
export function parseApplications(raw: string | null): Application[] {
  if (raw === null) {
    return [];
  }

  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) {
      return [];
    }
    return data.filter(isValidApplication);
  } catch {
    // Broken JSON is treated the same as "no saved data".
    return [];
  }
}

export function loadApplications(): Application[] {
  return parseApplications(localStorage.getItem(STORAGE_KEY));
}

export function saveApplications(applications: Application[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
}

// Deletes the saved data. Kept here so the storage key only appears in one file.
export function clearSavedApplications(): void {
  localStorage.removeItem(STORAGE_KEY);
}
