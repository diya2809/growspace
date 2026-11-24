// One small data layer. Four collections, plain documents keyed by a string `id`.
// MongoDB when DATABASE_URI is set, otherwise an in-memory store for local runs.
import { MongoClient, type Db } from 'mongodb';

export type User = { id: string; handle: string; name: string; pass: string; token: string; tz: string; createdAt: number };
export type Plant = { id: string; userId: string; name: string; kind: 'grow' | 'weed'; species: string; target: number; createdAt: number };
export type Log = { id: string; userId: string; plantId: string; day: string; note: string; source: 'claude' | 'app'; at: number };
export type Recap = { id: string; userId: string; week: string; persona: string; headline: string; highlights: string[]; nudge: string; at: number };

type Doc = { id: string } & Record<string, unknown>;
type Filter = Record<string, unknown>;
interface Col<T extends Doc> {
  find(filter: Filter): Promise<T[]>;
  insert(doc: T): Promise<void>;
  update(filter: Filter, patch: Partial<T>): Promise<void>;
  remove(filter: Filter): Promise<void>;
}

const g = globalThis as unknown as { __gsDb?: Promise<Db>; __gsMem?: Record<string, Doc[]> };

function mongo(): Promise<Db> {
  return (g.__gsDb ??= (async () => {
    const client = await new MongoClient(process.env.DATABASE_URI!).connect();
    const d = client.db();
    await Promise.all([
      d.collection('users').createIndex({ handle: 1 }, { unique: true }),
      d.collection('users').createIndex({ token: 1 }),
      d.collection('plants').createIndex({ userId: 1 }),
      d.collection('logs').createIndex({ userId: 1, at: -1 }),
      d.collection('recaps').createIndex({ userId: 1, week: 1 }),
    ]);
    return d;
  })().catch((e) => { g.__gsDb = undefined; throw e; }));
}

function mongoCol<T extends Doc>(name: string): Col<T> {
  const c = async () => (await mongo()).collection(name);
  return {
    find: async (f) => (await (await c()).find(f, { projection: { _id: 0 } }).toArray()) as unknown as T[],
    insert: async (doc) => void (await (await c()).insertOne({ ...doc })),
    update: async (f, patch) => void (await (await c()).updateMany(f, { $set: patch })),
    remove: async (f) => void (await (await c()).deleteMany(f)),
  };
}

function memCol<T extends Doc>(name: string): Col<T> {
  const mem = (g.__gsMem ??= {});
  const rows = () => (mem[name] ??= []) as T[];
  const match = (f: Filter) => (d: T) => Object.entries(f).every(([k, v]) => d[k] === v);
  return {
    find: async (f) => rows().filter(match(f)).map((d) => ({ ...d })),
    insert: async (doc) => void rows().push({ ...doc }),
    update: async (f, patch) => rows().filter(match(f)).forEach((d) => Object.assign(d, patch)),
    remove: async (f) => void (mem[name] = rows().filter((d) => !match(f)(d))),
  };
}

if (!process.env.DATABASE_URI && process.env.NODE_ENV === 'production') console.warn('Growspace: DATABASE_URI is not set. Using the in-memory store, data resets on restart.');
const col = <T extends Doc>(name: string) => (process.env.DATABASE_URI ? mongoCol<T>(name) : memCol<T>(name));

export const db = {
  users: col<User>('users'),
  plants: col<Plant>('plants'),
  logs: col<Log>('logs'),
  recaps: col<Recap>('recaps'),
};

export const uid = () => crypto.randomUUID().replace(/-/g, '').slice(0, 16);
