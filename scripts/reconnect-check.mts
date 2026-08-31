/**
 * Integration check for the multiplayer re-join-on-reconnect guarantee.
 *
 * Room membership lives on the server keyed by socket id; a dropped connection
 * yields a brand-new socket id, so without a replayed `world:join` the player is
 * silently evicted from the room while `socket.connected` still reads `true`.
 * This drives the REAL `SocketClient` against a REAL server across a forced
 * transport drop and asserts the player comes back — exactly once.
 *
 * Run:
 *   # 1. Postgres up + migrated (see README "Quick start")
 *   DATABASE_URL=... npm run dev:server          # or: npm start -w server
 *   # 2. in another shell
 *   npx tsx scripts/reconnect-check.mts [http://localhost:3001]
 *
 * Exits 0 on PASS, 1 on FAIL.
 */
import { SocketClient } from "../client/src/network/SocketClient.js";

const URL = process.argv[2] ?? "http://localhost:3001";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const joinRes = await fetch(`${URL}/api/worlds/auto-join`, { method: "POST" });
const world = (await joinRes.json()) as { slug: string };
const slug = world.slug;

const a = new SocketClient(URL);
const b = new SocketClient(URL);
const bJoinEvents: string[] = [];
const aWorldStates: unknown[][] = [];
b.onPlayerJoined((p) => bJoinEvents.push(p.id));
a.onWorldState((ps) => aWorldStates.push(ps));

await wait(1200);
// B joins first so every appearance of A reaches B as a `player:joined` event
// (a player already in the room when B joins would arrive via `world:state`).
b.joinWorld(slug, "B", "plane", undefined, false, "vid-B");
await wait(500);
a.joinWorld(slug, "A", "plane", undefined, false, "vid-A");
await wait(800);

const idBefore = a.id;
// Exactly one join should have been announced for A on the first connect.
const joinsForFirstId = bJoinEvents.filter((id) => id === idBefore).length;

// Simulate a network drop; Socket.io reconnects with a new socket id.
(a as unknown as { socket: { io: { engine: { close(): void } } } }).socket.io.engine.close();
await wait(3000);

const idAfter = a.id;
const joinsForSecondId = bJoinEvents.filter((id) => id === idAfter).length;

const dash = (await fetch(`${URL}/api/dashboard/worlds`).then((r) => r.json())) as {
  worlds: { slug: string; playerCount: number }[];
};
const playerCount = dash.worlds.find((w) => w.slug === slug)?.playerCount ?? 0;

a.disconnect();
b.disconnect();

const checks: [string, boolean, string][] = [
  ["socket reconnected with a new id", !!idAfter && idAfter !== idBefore, `${idBefore} -> ${idAfter}`],
  ["exactly one join on first connect", joinsForFirstId === 1, `saw ${joinsForFirstId}`],
  ["exactly one join on reconnect", joinsForSecondId === 1, `saw ${joinsForSecondId}`],
  ["player got a fresh world resync", aWorldStates.length >= 2, `${aWorldStates.length} world:state`],
  ["server room holds both players", playerCount === 2, `playerCount=${playerCount}`],
];
for (const [label, ok, detail] of checks) {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label.padEnd(34)} ${detail}`);
}
const pass = checks.every(([, ok]) => ok);
console.log(pass ? "\nRESULT: PASS" : "\nRESULT: FAIL");
process.exit(pass ? 0 : 1);
