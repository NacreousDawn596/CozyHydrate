interface TelemetryEvent {
  timestamp: number;
  reminderSent?: boolean;
  response?: "done" | "not_yet" | null;
  waterVolume?: number;
  eventType: "reminder_sent" | "reminder_response" | "manual_log";
  count?: number;
}

export async function sendTelemetry(event: TelemetryEvent): Promise<void> {
  try {
    const response = await fetch("https://drinking.kamal.monster/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...event,
        timestamp: Date.now(),
      }),
    });

    if (!response.ok) {
      console.warn("Telemetry send failed:", response.status);
    }
  } catch (error) {
    console.warn("Telemetry error:", error);
  }
}
