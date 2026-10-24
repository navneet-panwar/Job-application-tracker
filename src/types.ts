// A union type: an application can only have one of these four values.
export type Status = "Applied" | "Interview" | "Offer" | "Rejected";

// One stored application. Dates are "YYYY-MM-DD" strings (the value a date input gives).
export interface Application {
  id: string;
  company: string;
  role: string;
  status: Status;
  dateApplied: string;
  notes: string;
}

// The input we get from the form, before an id and trimmed values are added.
export type ApplicationInput = Omit<Application, "id">;

// The filter dropdown can also be "all", so it needs its own type.
export type StatusFilter = Status | "all";

export const STATUSES: Status[] = ["Applied", "Interview", "Offer", "Rejected"];

// Used to check values that come from outside (localStorage, the DOM) instead of trusting them.
export function isStatus(value: unknown): value is Status {
  return STATUSES.includes(value as Status);
}
