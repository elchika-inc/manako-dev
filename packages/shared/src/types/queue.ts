export type NotificationMessage =
  | {
      type: "incident.created";
      incidentId: string;
      monitorId: string | null;
      teamId: string;
      monitorName: string;
      monitorUrl?: string;
      title?: string;
      severity?: "critical" | "warning";
    }
  | {
      type: "incident.resolved";
      incidentId: string;
      monitorId: string | null;
      teamId: string;
      monitorName: string;
      title?: string;
    }
  | {
      type: "maintenance.started";
      teamId: string;
      monitorIds: string[];
      monitorNames: string[];
      maintenanceUntil: string;
      notify: true;
    }
  | {
      type: "maintenance.ended";
      teamId: string;
      monitorIds: string[];
      monitorNames: string[];
      notify: true;
    };
