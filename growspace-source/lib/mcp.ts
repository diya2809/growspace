// The MCP server: five tools over stateless Streamable HTTP. No AI here, only saving and reading.
import type { User } from './store';
import { addLogs, addPlants, editPlant, loadGarden, saveRecap } from './actions';
import { SPECIES, type Garden } from './garden';

const INSTRUCTIONS = `Growspace turns the user's goals and habits into a living garden. Each good habit is a plant that grows when the user makes progress. Each bad habit is a weed that grows when they slip.

How to use it well:
- When the user shares a goal, turn it into a few small, concrete habits and create them with "plant". Bad habits they want to stop become weeds.
- Whenever the user tells you they did something that matches a plant (in any conversation, even in passing), record it with "log" without being asked. Do the same for slips on a weed. Call "get_garden" first if you do not know their plants.
- When they ask how they are doing, call "get_garden" and coach from the real data.
- When they ask for a recap or "wrap" of their week, call "get_garden", then "save_recap" with a short, warm, specific summary.
- After any change, share the garden link from the result so they can watch it grow.`;

const TOOLS = [
  {
    name: 'get_garden',
    description: "Read the user's whole garden: every plant and weed, growth stage, streak, this week's progress, recent activity and the garden link. Call this before coaching, before a recap, or when you are unsure which plants exist.",
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { title: 'Read garden', readOnlyHint: true },
  },
  {
    name: 'plant',
    description: 'Create one or more plants in the garden. Use kind "grow" for a habit or goal the user wants to build, and kind "weed" for a bad habit they want to stop. Keep names short and concrete (2 to 4 words, for example "Morning run" or "Read 20 pages"). Create all plants for a goal in a single call.',
    inputSchema: {
      type: 'object', required: ['plants'], additionalProperties: false,
      properties: {
        plants: {
          type: 'array', minItems: 1, maxItems: 12,
          items: {
            type: 'object', required: ['name', 'kind'], additionalProperties: false,
            properties: {
              name: { type: 'string', description: 'Short habit name, 2 to 4 words.' },
              kind: { type: 'string', enum: ['grow', 'weed'] },
              species: { type: 'string', enum: [...SPECIES], description: 'Optional look of the plant. Pick one that suits the habit: tree for learning, sunflower for fitness, lavender for calm, fern for health, cactus for discipline, tulip for anything creative or social.' },
              weekly_target: { type: 'integer', minimum: 1, maximum: 7, description: 'How many times a week the user aims to do it. Default 3.' },
            },
          },
        },
      },
    },
    annotations: { title: 'Plant habits' },
  },
  {
    name: 'log',
    description: 'Record that the user did a habit (the plant grows) or slipped on a bad habit (the weed grows). Call this whenever the user mentions completing or slipping on something that matches one of their plants, without waiting to be asked. Several entries can go in one call.',
    inputSchema: {
      type: 'object', required: ['entries'], additionalProperties: false,
      properties: {
        entries: {
          type: 'array', minItems: 1, maxItems: 20,
          items: {
            type: 'object', required: ['plant'], additionalProperties: false,
            properties: {
              plant: { type: 'string', description: 'Plant name or id.' },
              note: { type: 'string', description: 'One short line about what happened, in the user\'s words. Max 140 characters.' },
              date: { type: 'string', description: 'YYYY-MM-DD if it happened on an earlier day. Leave out for today.' },
            },
          },
        },
      },
    },
    annotations: { title: 'Log progress' },
  },
  {
    name: 'edit_plant',
    description: 'Rename a plant, change its weekly target or look, or remove it. Only remove when the user clearly asks.',
    inputSchema: {
      type: 'object', required: ['plant'], additionalProperties: false,
      properties: {
        plant: { type: 'string', description: 'Current plant name or id.' },
        name: { type: 'string' },
        weekly_target: { type: 'integer', minimum: 1, maximum: 7 },
        species: { type: 'string', enum: [...SPECIES] },
        remove: { type: 'boolean' },
      },
    },
    annotations: { title: 'Edit plant' },
  },
  {
    name: 'save_recap',
    description: "Save this week's Garden Wrapped, written by you from the real garden data. It appears in the app as shareable story slides. Call get_garden first. Be specific, warm and honest, never generic.",
    inputSchema: {
      type: 'object', required: ['persona', 'headline', 'highlights', 'nudge'], additionalProperties: false,
      properties: {
        persona: { type: 'string', description: 'A playful 2 to 3 word title for the user this week, for example "The Dawn Reader". Max 40 characters.' },
        headline: { type: 'string', description: 'One sentence that sums up the week. Max 120 characters.' },
        highlights: { type: 'array', minItems: 1, maxItems: 3, items: { type: 'string' }, description: 'Up to three short, specific wins or observations.' },
        nudge: { type: 'string', description: 'One gentle, concrete suggestion for next week. Max 140 characters.' },
      },
    },
    annotations: { title: 'Save weekly recap' },
  },
];

function describe(gd: Garden, base: string) {
  const link = `${base}/@${gd.handle}`;
  if (!gd.plants.length) return `The garden is empty. Create plants with the "plant" tool.\nGarden: ${base}/garden`;
  const lines = gd.plants.map((p) =>
    p.kind === 'weed'
      ? `- WEED "${p.name}" (id ${p.id}): ${p.level ? `size ${p.level} of 4` : 'cleared'}, ${p.week} slips this week, ${p.cleanDays} clean days`
      : `- "${p.name}" (id ${p.id}): ${p.stageName}${p.wilted ? ', WILTING (no progress for a week)' : ''}, ${p.total} logs in total, ${p.week}/${p.target} this week${p.toNext ? `, ${p.toNext} more to the next stage` : ''}`);
  const recent = gd.feed.slice(0, 8).map((l) => `- ${l.day} ${l.kind === 'weed' ? 'slip' : 'done'}: ${l.plant}${l.note ? ` (${l.note})` : ''}`);
  return [
    `${gd.name}'s garden, today ${gd.today}`,
    `Streak: ${gd.streak} days (best ${gd.best}). This week: ${gd.weekLogs} wins, ${gd.weekSlips} slips.`,
    '', 'Plants:', ...lines, '', 'Recent:', ...(recent.length ? recent : ['- nothing yet']),
    '', `Garden (owner): ${base}/garden`, `Public link to share: ${link}`, `Weekly Wrapped: ${base}/wrapped`,
  ].join('\n');
}

async function callTool(user: User, name: string, a: Record<string, any>, base: string): Promise<string> {
  const open = `Open the garden: ${base}/garden`;
  switch (name) {
    case 'get_garden':
      return describe(await loadGarden(user), base);
    case 'plant': {
      const { made, skipped } = await addPlants(user, Array.isArray(a.plants) ? a.plants : [a]);
      return [
        made.length ? `Planted ${made.length}: ${made.map((p) => `"${p.name}" (${p.kind === 'weed' ? 'weed' : p.species}, ${p.target}x a week)`).join(', ')}.` : 'Nothing new was planted.',
        skipped.length ? `Already in the garden or over the limit: ${skipped.join(', ')}.` : '', open,
      ].filter(Boolean).join('\n');
    }
    case 'log': {
      const { logged, missing, plants } = await addLogs(user, Array.isArray(a.entries) ? a.entries : [a], 'claude');
      const gd = await loadGarden(user);
      const out = logged.map(({ plant, day }) => {
        const v = gd.plants.find((p) => p.id === plant.id)!;
        return plant.kind === 'weed'
          ? `Slip recorded on "${plant.name}" (${day}). The weed is now size ${v.level} of 4.`
          : `Watered "${plant.name}" (${day}). It is now ${v.stageName}${v.toNext ? `, ${v.toNext} more to the next stage` : ''}. ${v.week}/${v.target} this week.`;
      });
      if (missing.length) out.push(`No plant matched: ${missing.join(', ')}. Existing plants: ${plants.map((p) => p.name).join(', ') || 'none'}.`);
      out.push(`Streak: ${gd.streak} days.`, open);
      return out.join('\n');
    }
    case 'edit_plant': {
      const p = await editPlant(user, String(a.plant ?? ''), a);
      if (!p) return `No plant matched "${a.plant}". Call get_garden to see the plants.`;
      return p.removed ? `Removed "${p.name}".\n${open}` : `Updated: "${p.name}", ${p.target}x a week${p.kind === 'grow' ? `, ${p.species}` : ''}.\n${open}`;
    }
    case 'save_recap':
      await saveRecap(user, a);
      return `Recap saved. The user can watch and share it here: ${base}/wrapped`;
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

const VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];

type Rpc = { jsonrpc: '2.0'; id?: string | number | null; method?: string; params?: any };
export async function handleRpc(user: User, msg: Rpc, base: string) {
  const ok = (result: unknown) => ({ jsonrpc: '2.0', id: msg.id, result });
  const fail = (code: number, message: string) => ({ jsonrpc: '2.0', id: msg.id ?? null, error: { code, message } });
  if (msg.id === undefined || msg.id === null) return null; // notifications need no reply
  try {
    switch (msg.method) {
      case 'initialize':
        return ok({
          protocolVersion: VERSIONS.includes(msg.params?.protocolVersion) ? msg.params.protocolVersion : VERSIONS[1],
          capabilities: { tools: { listChanged: false } },
          serverInfo: { name: 'growspace', title: 'Growspace', version: '1.0.0' },
          instructions: INSTRUCTIONS,
        });
      case 'ping': return ok({});
      case 'tools/list': return ok({ tools: TOOLS });
      case 'resources/list': return ok({ resources: [] });
      case 'prompts/list': return ok({ prompts: [] });
      case 'tools/call': {
        const name = msg.params?.name;
        if (!TOOLS.some((t) => t.name === name)) return fail(-32602, `Unknown tool: ${name}`);
        try {
          return ok({ content: [{ type: 'text', text: await callTool(user, name, msg.params?.arguments ?? {}, base) }] });
        } catch (e) {
          return ok({ content: [{ type: 'text', text: `Growspace could not do that: ${(e as Error).message}` }], isError: true });
        }
      }
      default: return fail(-32601, `Method not found: ${msg.method}`);
    }
  } catch (e) {
    return fail(-32603, (e as Error).message);
  }
}
