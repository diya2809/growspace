// Every edit a person makes in the app. Returns the fresh garden.
import { currentUser } from '@/lib/auth';
import { addLogs, addPlants, clearRecap, editPlant, loadGarden, removeLog } from '@/lib/actions';

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return Response.json({ error: 'Signed out' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  switch (b.op) {
    case 'plant': await addPlants(user, [b]); break;
    case 'log': await addLogs(user, [{ plant: b.plant, note: b.note }], 'app'); break;
    case 'undo': await removeLog(user, String(b.id)); break;
    case 'edit': await editPlant(user, String(b.plant), b); break;
    case 'clear_recap': await clearRecap(user); break;
    default: return Response.json({ error: 'Unknown action' }, { status: 400 });
  }
  return Response.json(await loadGarden(user));
}
