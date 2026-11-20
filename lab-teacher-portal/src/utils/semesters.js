function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function pickCurrentSemester(items) {
  const semesters = [...new Map(items.map((i) => [i.semester.semesterId, i.semester])).values()];
  if (semesters.length === 0) return null;
  const today = todayIso();
  return (
    semesters.find((s) => s.startDate <= today && today <= s.endDate) ??
    semesters.sort((a, b) => b.startDate.localeCompare(a.startDate))[0]
  );
}

export function groupBySemester(items) {
  const groups = new Map();
  for (const item of items) {
    const key = item.semester.semesterId;
    if (!groups.has(key)) groups.set(key, { semester: item.semester, items: [] });
    groups.get(key).items.push(item);
  }
  return [...groups.values()];
}
