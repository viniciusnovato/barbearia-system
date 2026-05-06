/** Gera URL de "Adicionar ao Google Calendar" sem precisar de OAuth. */

interface CalendarEventOpts {
  title: string;
  description?: string;
  /** Data ISO ou YYYY-MM-DD (será tratada como dia inteiro) */
  start: string;
  /** Duração em minutos (default 30) */
  durationMinutes?: number;
  location?: string;
}

function formatGCalDate(date: Date): string {
  // YYYYMMDDTHHMMSSZ
  const pad = (n: number) => n.toString().padStart(2, "0");
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z"
  );
}

export function buildGoogleCalendarUrl(opts: CalendarEventOpts): string {
  const start = new Date(opts.start);
  if (Number.isNaN(start.getTime())) return "#";

  // Default: marca às 14h locais
  if (opts.start.length <= 10) {
    start.setHours(14, 0, 0, 0);
  }
  const end = new Date(start.getTime() + (opts.durationMinutes ?? 30) * 60000);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: opts.title,
    dates: `${formatGCalDate(start)}/${formatGCalDate(end)}`,
    ...(opts.description && { details: opts.description }),
    ...(opts.location && { location: opts.location }),
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
