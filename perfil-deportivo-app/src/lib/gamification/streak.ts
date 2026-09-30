// Racha semanal: cuenta semanas (lunes a domingo, UTC) consecutivas con al
// menos una accion registrada (partido, foto o club nuevo). Si la semana
// actual todavia no tiene actividad no corta la racha (la semana no
// termino todavia), pero tampoco cuenta como semana cumplida.

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function startOfWeekMonday(d: Date): Date {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay(); // 0=domingo..6=sabado
  const diff = (day === 0 ? -6 : 1) - day;
  date.setUTCDate(date.getUTCDate() + diff);
  return date;
}

function weekKey(d: Date): string {
  return startOfWeekMonday(d).toISOString().slice(0, 10);
}

export type StreakInfo = {
  weeks: number;
  // Ultimas 4 semanas, de la mas vieja a la mas nueva (incluye la actual).
  last4Weeks: boolean[];
};

export function computeStreak(activityDates: Date[]): StreakInfo {
  const weekKeys = new Set(activityDates.map(weekKey));
  const now = new Date();
  const currentWeekStart = startOfWeekMonday(now);

  const last4Weeks: boolean[] = [];
  for (let i = 3; i >= 0; i--) {
    const wk = new Date(currentWeekStart.getTime() - i * WEEK_MS);
    last4Weeks.push(weekKeys.has(weekKey(wk)));
  }

  let cursor = currentWeekStart;
  if (!weekKeys.has(weekKey(cursor))) {
    cursor = new Date(cursor.getTime() - WEEK_MS);
  }
  let weeks = 0;
  while (weekKeys.has(weekKey(cursor))) {
    weeks++;
    cursor = new Date(cursor.getTime() - WEEK_MS);
  }

  return { weeks, last4Weeks };
}
