// A ready-made garden so anyone can try the app straight away. Login: demo / growspace
import { randomBytes } from 'crypto';
import { db, uid } from './store';
import { addDays, dayIn, weekStart } from './garden';
import { hash } from './auth';

export async function seedDemo() {
  if ((await db.users.find({ handle: 'demo' })).length) return;
  const tz = 'Asia/Kolkata';
  const user = {
    id: uid(), handle: 'demo', name: 'Diya', pass: hash(process.env.DEMO_PASSWORD || 'growspace'),
    token: randomBytes(18).toString('base64url'), tz, createdAt: Date.now() - 20 * 864e5,
  };
  await db.users.insert(user);
  const today = dayIn(tz);
  const plan: [string, 'grow' | 'weed', string, number, number[], string[]][] = [
    ['Read 20 pages', 'grow', 'tree', 5, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], ['Finished chapter 4', 'Read on the train', 'Atomic Habits, 22 pages']],
    ['Morning run', 'grow', 'sunflower', 4, [0, 1, 2, 4, 5, 7, 8, 10, 11], ['3 km before class', 'Easy 20 minutes', 'New best pace']],
    ['Badminton practice', 'grow', 'tulip', 3, [1, 3, 6, 9], ['Footwork drills', 'Doubles with the academy']],
    ['Meditate', 'grow', 'lavender', 3, [2], ['Ten quiet minutes']],
    ['Late-night scrolling', 'weed', 'weed', 1, [2, 5], ['Reels until 1 am', 'Lost an hour on the phone']],
  ];
  let n = 0;
  for (const [name, kind, species, target, ago, notes] of plan) {
    const id = uid();
    await db.plants.insert({ id, userId: user.id, name, kind, species, target, createdAt: user.createdAt + n++ });
    for (const [i, a] of ago.entries()) {
      await db.logs.insert({
        id: uid(), userId: user.id, plantId: id, day: addDays(today, -a), note: notes[i % notes.length],
        source: i % 3 === 2 ? 'app' : 'claude', at: Date.now() - a * 864e5 - (n * 7 + i) * 6e5,
      });
    }
  }
  await db.recaps.insert({
    id: uid(), userId: user.id, week: weekStart(today), persona: 'The Dawn Reader',
    headline: 'You read every single day and ran before most people woke up.',
    highlights: ['A reading streak that never broke', 'Morning runs became the default, not the exception', 'Only two late-night slips all week'],
    nudge: 'Meditation is one quiet sprout. Give it two mornings next week.', at: Date.now(),
  });
}
