// Every change to a garden goes through here, whether it comes from Claude (MCP) or from the app.
import { db, uid, type Plant, type User } from './store';
import { addDays, computeGarden, dayIn, weekStart, SPECIES, type Garden } from './garden';

const MAX_PLANTS = 24;
const clip = (s: unknown, n: number) => String(s ?? '').trim().replace(/\s+/g, ' ').slice(0, n);

export async function loadGarden(user: User): Promise<Garden> {
  const [plants, logs, recaps] = await Promise.all([
    db.plants.find({ userId: user.id }), db.logs.find({ userId: user.id }), db.recaps.find({ userId: user.id }),
  ]);
  const recap = recaps.sort((a, b) => b.at - a.at)[0] ?? null;
  return computeGarden(user, plants, logs, recap);
}

const HINTS: [RegExp, string][] = [
  [/read|book|study|learn|write|journal|code/i, 'tree'],
  [/run|gym|workout|walk|sport|badminton|yoga|exercise|fit|swim|cycle/i, 'sunflower'],
  [/meditat|sleep|calm|breath|pray|mindful/i, 'lavender'],
  [/water|drink|diet|eat|cook|meal/i, 'fern'],
  [/save|money|budget|focus|discipline/i, 'cactus'],
];
function pickSpecies(name: string, wanted?: string) {
  if (wanted && (SPECIES as readonly string[]).includes(wanted)) return wanted;
  const hint = HINTS.find(([re]) => re.test(name));
  if (hint) return hint[1];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return SPECIES[h % SPECIES.length];
}

function findPlant(plants: Plant[], ref: string) {
  const r = clip(ref, 60).toLowerCase();
  if (!r) return undefined;
  return plants.find((p) => p.id === ref) ?? plants.find((p) => p.name.toLowerCase() === r)
    ?? plants.find((p) => p.name.toLowerCase().includes(r) || r.includes(p.name.toLowerCase()));
}

export type NewPlant = { name: string; kind?: string; species?: string; weekly_target?: number };
export async function addPlants(user: User, items: NewPlant[]) {
  const existing = await db.plants.find({ userId: user.id });
  const made: Plant[] = [], skipped: string[] = [];
  for (const it of items) {
    const name = clip(it.name, 40);
    if (!name) continue;
    if (findPlantExact(existing.concat(made), name) || existing.length + made.length >= MAX_PLANTS) { skipped.push(name); continue; }
    const kind = it.kind === 'weed' ? 'weed' : 'grow';
    const plant: Plant = {
      id: uid(), userId: user.id, name, kind, species: kind === 'weed' ? 'weed' : pickSpecies(name, it.species),
      target: Math.min(7, Math.max(1, Math.round(Number(it.weekly_target) || (kind === 'weed' ? 1 : 3)))), createdAt: Date.now() + made.length,
    };
    await db.plants.insert(plant);
    made.push(plant);
  }
  return { made, skipped };
}
const findPlantExact = (plants: Plant[], name: string) => plants.find((p) => p.name.toLowerCase() === name.toLowerCase());

export type NewLog = { plant: string; note?: string; date?: string };
export async function addLogs(user: User, entries: NewLog[], source: 'claude' | 'app') {
  const plants = await db.plants.find({ userId: user.id });
  const today = dayIn(user.tz);
  const logged: { plant: Plant; day: string; id: string }[] = [], missing: string[] = [];
  for (const e of entries.slice(0, 20)) {
    const plant = findPlant(plants, e.plant);
    if (!plant) { missing.push(clip(e.plant, 60)); continue; }
    const d = /^\d{4}-\d{2}-\d{2}$/.test(e.date ?? '') ? e.date! : today;
    const day = d > today || d < addDays(today, -60) ? today : d;
    const id = uid();
    await db.logs.insert({ id, userId: user.id, plantId: plant.id, day, note: clip(e.note, 140), source, at: Date.now() + logged.length });
    logged.push({ plant, day, id });
  }
  return { logged, missing, plants };
}

export async function editPlant(user: User, ref: string, patch: { name?: string; weekly_target?: number; species?: string; remove?: boolean }) {
  const plant = findPlant(await db.plants.find({ userId: user.id }), ref);
  if (!plant) return null;
  if (patch.remove) {
    await db.plants.remove({ userId: user.id, id: plant.id });
    await db.logs.remove({ userId: user.id, plantId: plant.id });
    return { ...plant, removed: true };
  }
  const next: Partial<Plant> = {};
  if (patch.name && clip(patch.name, 40)) next.name = clip(patch.name, 40);
  if (patch.weekly_target) next.target = Math.min(7, Math.max(1, Math.round(Number(patch.weekly_target))));
  if (patch.species && plant.kind === 'grow' && (SPECIES as readonly string[]).includes(patch.species)) next.species = patch.species;
  if (Object.keys(next).length) await db.plants.update({ userId: user.id, id: plant.id }, next);
  return { ...plant, ...next, removed: false };
}

export const removeLog = (user: User, id: string) => db.logs.remove({ userId: user.id, id });

export async function saveRecap(user: User, r: { persona?: string; headline?: string; highlights?: string[]; nudge?: string }) {
  const week = weekStart(dayIn(user.tz));
  await db.recaps.remove({ userId: user.id, week });
  await db.recaps.insert({
    id: uid(), userId: user.id, week, persona: clip(r.persona, 40) || 'The Gardener', headline: clip(r.headline, 120),
    highlights: (Array.isArray(r.highlights) ? r.highlights : []).map((h) => clip(h, 110)).filter(Boolean).slice(0, 3),
    nudge: clip(r.nudge, 140), at: Date.now(),
  });
}
export const clearRecap = (user: User) => db.recaps.remove({ userId: user.id });
