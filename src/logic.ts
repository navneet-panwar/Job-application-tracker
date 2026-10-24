import type { Application, ApplicationInput, Status, StatusFilter } from "./types";

// All functions here are "pure": same input -> same output, no DOM, no storage.
// That is why they are easy to unit test and why they live in their own file.

export function createApplication(input: ApplicationInput): Application {
  return {
    id: crypto.randomUUID(),
    company: input.company.trim(),
    role: input.role.trim(),
    status: input.status,
    dateApplied: input.dateApplied,
    notes: input.notes.trim()
  };
}

// Applies the search text and the status filter, then sorts newest first.
export function filterApplications(
  applications: Application[],
  search: string,
  status: StatusFilter
): Application[] {
  const query = search.trim().toLowerCase();

  return applications
    .filter((app) => {
      const matchesSearch =
        query === "" ||
        app.company.toLowerCase().includes(query) ||
        app.role.toLowerCase().includes(query);

      const matchesStatus = status === "all" || app.status === status;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => b.dateApplied.localeCompare(a.dateApplied));
}

// Counts how many applications there are for each status.
export function countByStatus(applications: Application[]): Record<Status, number> {
  const counts: Record<Status, number> = {
    Applied: 0,
    Interview: 0,
    Offer: 0,
    Rejected: 0
  };

  for (const app of applications) {
    counts[app.status] = (counts[app.status] ?? 0) + 1;
  }

  return counts;
}

// Builds a new array with one item replaced. Handy because we never mutate the state array.
export function updateApplication(
  applications: Application[],
  id: string,
  changes: ApplicationInput
): Application[] {
  return applications.map((app) =>
    app.id === id
      ? {
        ...app,
        company: changes.company.trim(),
        role: changes.role.trim(),
        status: changes.status,
        dateApplied: changes.dateApplied,
        notes: changes.notes.trim()
      }
      : app
  );
}

export function removeApplication(applications: Application[], id: string): Application[] {
  return applications.filter((app) => app.id !== id);
}

// The empty list message needs to know if filters are on.
export function hasActiveFilters(search: string, status: StatusFilter): boolean {
  return search.trim() !== "" || status !== "all";
}


