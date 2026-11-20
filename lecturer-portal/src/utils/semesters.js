// utils/semesters.js — helpers for items carrying a `semester` ({ semesterId, name, startDate, endDate }).

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** The semester running today, otherwise the most recent one. Dates are 'YYYY-MM-DD' strings. */
export function pickCurrentSemester(items) {
  const semesters = [...new Map(items.map((i) => [i.semester.semesterId, i.semester])).values()];
  if (semesters.length === 0) return null;
  const today = todayIso();
  return (
    semesters.find((s) => s.startDate <= today && today <= s.endDate) ??
    semesters.sort((a, b) => b.startDate.localeCompare(a.startDate))[0]
  );
}

/** Groups items by semester, keeping the incoming order (API sends newest first). */
export function groupBySemester(items) {
  const groups = new Map();
  for (const item of items) {
    const key = item.semester.semesterId;
    if (!groups.has(key)) groups.set(key, { semester: item.semester, items: [] });
    groups.get(key).items.push(item);
  }
  return [...groups.values()];
}
