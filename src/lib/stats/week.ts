/**
 * Computes Monday-to-Sunday week day objects for the current calendar week.
 * Pure date calculations safe for both Client and Server components.
 */
export function getCurrentWeekDays(activeDates: string[]) {
  const activeSet = new Set(activeDates);
  const now = new Date();
  const currentDay = now.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat
  // Distance from today to Monday of the current week:
  const distToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + distToMonday);

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return dayLabels.map((dayName, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    const dateStr = d.toISOString().split("T")[0];
    const isToday = dateStr === now.toISOString().split("T")[0];
    const active = activeSet.has(dateStr);

    return {
      day: dayName,
      active,
      isToday,
      date: dateStr,
    };
  });
}
