import { describe, expect, it } from "vitest";
import type { Application } from "../src/types";
import { countByStatus, filterApplications } from "../src/logic";
import { parseApplications } from "../src/storage";

// A small helper so each test only has to write the fields it cares about.
function makeApplication(overrides: Partial<Application>): Application {
  return {
    id: "id-1",
    company: "Acme",
    role: "Frontend Developer",
    status: "Applied",
    dateApplied: "2026-03-01",
    notes: "",
    ...overrides
  };
}

const applications: Application[] = [
  makeApplication({ id: "1", company: "Acme", role: "Junior Developer", status: "Applied", dateApplied: "2026-02-10" }),
  makeApplication({ id: "2", company: "Bluebird", role: "Tester", status: "Interview", dateApplied: "2026-03-05" }),
  makeApplication({ id: "3", company: "acme labs", role: "Support Engineer", status: "Applied", dateApplied: "2026-03-20" }),
  makeApplication({ id: "4", company: "Northwind", role: "Web Developer", status: "Rejected", dateApplied: "2026-01-15" })
];

describe("filterApplications", () => {
  it("returns everything, newest first, when there is no search and no status", () => {
    const result = filterApplications(applications, "", "all");
    expect(result.map((app) => app.id)).toEqual(["3", "2", "1", "4"]);
  });

  it("searches company and role without caring about upper/lower case", () => {
    const byCompany = filterApplications(applications, "ACME", "all");
    expect(byCompany.map((app) => app.id)).toEqual(["3", "1"]);

    const byRole = filterApplications(applications, "developer", "all");
    expect(byRole.map((app) => app.id)).toEqual(["1", "4"]);
  });

  it("combines the search with the status filter", () => {
    const result = filterApplications(applications, "acme", "Applied");
    expect(result.map((app) => app.id)).toEqual(["3", "1"]);

    const none = filterApplications(applications, "acme", "Offer");
    expect(none).toEqual([]);
  });
});

describe("countByStatus", () => {
  it("counts each status and always returns all four keys", () => {
    expect(countByStatus(applications)).toEqual({
      Applied: 2,
      Interview: 1,
      Offer: 0,
      Rejected: 1
    });
  });

  it("returns zeros for an empty list", () => {
    expect(countByStatus([])).toEqual({ Applied: 0, Interview: 0, Offer: 0, Rejected: 0 });
  });
});

describe("parseApplications", () => {
  it("returns an empty list for missing or broken data", () => {
    expect(parseApplications(null)).toEqual([]);
    expect(parseApplications("not json")).toEqual([]);
    expect(parseApplications('{"id":"1"}')).toEqual([]);
  });

  it("keeps valid items and drops invalid ones", () => {
    const raw = JSON.stringify([applications[0], { company: "Missing fields" }]);
    const result = parseApplications(raw);
    expect(result).toHaveLength(1);
    expect(result[0]?.company).toBe("Acme");
  });
});
