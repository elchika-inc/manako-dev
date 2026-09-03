import type { IncidentType } from "../constants.js";

interface IncidentBase {
  id: string;
  monitorId: string | null;
  teamId: string;
  type: IncidentType;
  title: string | null;
  startedAt: string;
  cause: string | null;
}

/** An incident that is still open (ongoing or acknowledged). resolvedAt is always null. */
export type OngoingIncident = IncidentBase & {
  status: "ongoing" | "acknowledged";
  resolvedAt: null;
};

/** An incident that has been resolved. resolvedAt is always a non-null timestamp. */
export type ResolvedIncident = IncidentBase & {
  status: "resolved";
  resolvedAt: string;
};

/**
 * Discriminated union of incident states.
 * Use `incident.status === "resolved"` to narrow to ResolvedIncident
 * and access `resolvedAt` as string (not null).
 */
export type Incident = OngoingIncident | ResolvedIncident;
