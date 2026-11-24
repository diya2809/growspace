import { db } from '@/lib/store';
import { handleRpc } from '@/lib/mcp';
import { originOf } from '@/lib/origin';

export const dynamic = 'force-dynamic';
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization, Mcp-Session-Id, Mcp-Protocol-Version',
};
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: cors });

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [user] = token.length >= 16 ? await db.users.find({ token }) : [];
  if (!user) return json({ jsonrpc: '2.0', id: null, error: { code: -32001, message: 'This Growspace link is not valid. Copy a fresh one from the Connect page.' } }, 404);
  let body: unknown;
  try { body = await req.json(); } catch { return json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, 400); }
  const base = originOf(req);
  if (Array.isArray(body)) {
    const out = (await Promise.all(body.map((m) => handleRpc(user, m, base)))).filter(Boolean);
    return out.length ? json(out) : new Response(null, { status: 202, headers: cors });
  }
  const res = await handleRpc(user, body as any, base);
  return res ? json(res) : new Response(null, { status: 202, headers: cors });
}
export const OPTIONS = () => new Response(null, { status: 204, headers: cors });
const notAllowed = () => new Response('Growspace MCP server. Add this address to Claude as a custom connector.', { status: 405, headers: { ...cors, Allow: 'POST, OPTIONS' } });
export { notAllowed as GET, notAllowed as DELETE };
