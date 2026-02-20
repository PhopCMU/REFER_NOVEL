// dateUtils.ts
export const NEW_THRESHOLD_HOURS = 24; // ปรับได้ตามต้องการ

export function toDate(value: string | Date): Date {
  return value instanceof Date ? value : new Date(value);
}

export function isNew(
  updatedAt: string | Date,
  thresholdHours = NEW_THRESHOLD_HOURS,
): boolean {
  const updated = toDate(updatedAt);
  const now = new Date();
  const diffMs = now.getTime() - updated.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours <= thresholdHours;
}

export function formatThaiDateTime(date: string | Date): string {
  const d = toDate(date);
  return d.toLocaleDateString("th-TH", {
    timeZone: "Asia/Bangkok",
    hour12: false,
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    numberingSystem: "latn",
  });
}
