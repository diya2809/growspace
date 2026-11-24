// The rules of the garden. Everything here is derived from the log, nothing is stored.
import type { Log, Plant, Recap, User } from './store';

export const SPECIES = ['sunflower', 'tulip', 'lavender', 'cactus', 'tree', 'fern'] as const;
export const STAGES = ['Seed', 'Sprout', 'Growing', 'Blooming', 'Flourishing'] as const;
const STAGE_AT = [0, 1, 3, 7, 14]; // logs needed to reach each stage
const WILT_DAYS = 7;
const WEED_WINDOW = 7;

export const dayIn = (tz: string, d: Date | number = Date.now()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
const toMs = (day: string) => Date.parse(day + 'T00:00:00Z');
export const addDays = (day: string, n: number) => new Date(toMs(day) + n * 864e5).toISOString().slice(0, 10);
export const daysBetween = (a: string, b: string) => Math.round((toMs(b) - toMs(a)) / 864e5);
export const weekStart = (day: string) => addDays(day, -((new Date(toMs(day)).getUTCDay() + 6) % 7)); // Monday

export type PlantView = {
  id: string; name: string; kind: 'grow' | 'weed'; species: string; target: number;
  total: number; week: number; stage: number; stageName: string; progress: number; toNext: number;
  wilted: boolean; level: number; cleanDays: number | null; lastDay: string | null;
};
export type LogView = { id: string; plantId: string; plant: string; kind: 'grow' | 'weed'; day: string; note: string; source: 'claude' | 'app'; at: number };
export type Garden = {
  name: string; handle: string; today: string; streak: number; best: number;
  weekLogs: number; weekSlips: number; totalLogs: number;
  days: { day: string; count: number; slips: number }[];
  plants: PlantView[]; feed: LogView[]; recap: Omit<Recap, 'id' | 'userId'> | null;
};

export function computeGarden(user: User, plants: Plant[], logs: Log[], recap: Recap | null, now = Date.now()): Garden {
  const today = dayIn(user.tz, now);
  const monday = weekStart(today);
  const byPlant = new Map<string, Log[]>();
  for (const l of logs) (byPlant.get(l.plantId) ?? byPlant.set(l.plantId, []).get(l.plantId)!).push(l);
  const kindOf = new Map(plants.map((p) => [p.id, p]));

  const views: PlantView[] = [...plants].sort((a, b) => a.createdAt - b.createdAt).map((p) => {
    const mine = byPlant.get(p.id) ?? [];
    const total = mine.length;
    const week = mine.filter((l) => l.day >= monday).length;
    const lastDay = mine.reduce<string | null>((m, l) => (!m || l.day > m ? l.day : m), null);
    const base = { id: p.id, name: p.name, kind: p.kind, species: p.species, target: p.target, total, week, lastDay };
    if (p.kind === 'weed') {
      const level = Math.min(4, mine.filter((l) => daysBetween(l.day, today) < WEED_WINDOW).length);
      const since = lastDay ?? dayIn(user.tz, p.createdAt);
      return { ...base, stage: 0, stageName: level ? 'Weed' : 'Clear', progress: 0, toNext: 0, wilted: false, level, cleanDays: Math.max(0, daysBetween(since, today)) };
    }
    let stage = 0;
    while (stage < 4 && total >= STAGE_AT[stage + 1]) stage++;
    const lo = STAGE_AT[stage], hi = STAGE_AT[stage + 1] ?? lo;
    const idle = daysBetween(lastDay ?? dayIn(user.tz, p.createdAt), today);
    return {
      ...base, stage, stageName: STAGES[stage], progress: hi > lo ? (total - lo) / (hi - lo) : 1, toNext: Math.max(0, hi - total),
      wilted: idle >= WILT_DAYS, level: 0, cleanDays: null,
    };
  });

  // Streak: consecutive days with at least one growth log, ending today or yesterday.
  const growDays = new Set(logs.filter((l) => kindOf.get(l.plantId)?.kind === 'grow').map((l) => l.day));
  let streak = 0;
  for (let d = growDays.has(today) ? today : addDays(today, -1); growDays.has(d); d = addDays(d, -1)) streak++;
  let best = 0, run = 0, prev = '';
  for (const d of [...growDays].sort()) { run = prev && daysBetween(prev, d) === 1 ? run + 1 : 1; best = Math.max(best, run); prev = d; }

  const isSlip = (l: Log) => kindOf.get(l.plantId)?.kind === 'weed';
  const days = Array.from({ length: 7 }, (_, i) => {
    const day = addDays(monday, i);
    const on = logs.filter((l) => l.day === day);
    return { day, count: on.filter((l) => !isSlip(l)).length, slips: on.filter(isSlip).length };
  });
  const feed: LogView[] = [...logs].sort((a, b) => b.at - a.at).slice(0, 12).flatMap((l) => {
    const p = kindOf.get(l.plantId);
    return p ? [{ id: l.id, plantId: l.plantId, plant: p.name, kind: p.kind, day: l.day, note: l.note, source: l.source, at: l.at }] : [];
  });

  return {
    name: user.name, handle: user.handle, today, streak, best,
    weekLogs: days.reduce((s, d) => s + d.count, 0), weekSlips: days.reduce((s, d) => s + d.slips, 0),
    totalLogs: logs.filter((l) => !isSlip(l)).length, days, plants: views, feed,
    recap: recap ? { week: recap.week, persona: recap.persona, headline: recap.headline, highlights: recap.highlights, nudge: recap.nudge, at: recap.at } : null,
  };
}

// What strangers see: weeds stay anonymous and notes stay private.
export function publicView(gd: Garden): Garden {
  return {
    ...gd, feed: [],
    plants: gd.plants.map((p) => (p.kind === 'weed' ? { ...p, name: 'A weed' } : p)),
  };
}
