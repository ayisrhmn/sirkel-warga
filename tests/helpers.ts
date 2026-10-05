// Shared setup for the integration tests: the real Server Actions run against
// a separate database (`sirkel_test`, created and migrated automatically);
// only Next.js request APIs are faked.
import { Client } from "pg";
import { textToDoc } from "../src/lib/rich-text";
import { beforeAll, expect, mock } from "bun:test";

// --- Fake Next.js request context ------------------------------------------

// A minimal browser cookie jar: requests send it, and Better Auth's
// nextCookies plugin updates it through cookies().set(...).
export const jar = new Map<string, string>();
let forwardedFor = "";
// Pretend the next requests come from this address (x-forwarded-for).
export const setForwardedFor = (ip: string) => void (forwardedFor = ip);
const cookieHeader = () =>
  [...jar].map(([name, value]) => `${name}=${value}`).join("; ");
mock.module("next/headers", () => ({
  headers: async () =>
    new Headers({ cookie: cookieHeader(), ...(forwardedFor ? { "x-forwarded-for": forwardedFor } : {}) }),
  cookies: async () => ({
    set: (name: string, value: string) => void jar.set(name, value),
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name) } : undefined),
    getAll: () => [],
    delete: (name: string) => void jar.delete(name),
  }),
}));
mock.module("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT:${to}`);
  },
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
mock.module("next/cache", () => ({
  revalidatePath() {},
  updateTag() {},
  unstable_cache: <T>(fn: T) => fn,
}));

// --- Separate database ------------------------------------------------------

const baseUrl = process.env.DATABASE_URL ?? "";
const testUrl = baseUrl.replace(/\/[^/?]+(\?|$)/, "/sirkel_test$1");
if (!baseUrl || testUrl === baseUrl) throw new Error("DATABASE_URL not usable");

export type Modules = {
  auth: typeof import("../src/lib/auth").auth;
  db: ReturnType<typeof import("../src/lib/db").getDb>;
  createCommunity: typeof import("../src/app/create-community/actions").createCommunity;
  users: typeof import("../src/app/admin/[communitySlug]/users/actions");
  settings: typeof import("../src/app/admin/[communitySlug]/settings/actions");
  changePassword: typeof import("../src/app/change-password/actions").changePassword;
  requireMember: typeof import("../src/lib/access").requireMember;
  requireUser: typeof import("../src/lib/session").requireUser;
  announcements: typeof import("../src/app/admin/[communitySlug]/announcements/actions");
  events: typeof import("../src/app/admin/[communitySlug]/events/actions");
  contacts: typeof import("../src/app/admin/[communitySlug]/contacts/actions");
  getPublicContent: typeof import("../src/lib/public-content").getPublicContent;
  publicDetail: typeof import("../src/lib/public-detail");
  datasets: typeof import("../src/app/admin/[communitySlug]/datasets/actions");
  exportAll: typeof import("../src/app/admin/[communitySlug]/datasets/export/route").GET;
  exportCsv: typeof import("../src/app/admin/[communitySlug]/datasets/[id]/export/route").GET;
  getPublicDataset: typeof import("../src/lib/public-dataset").getPublicDataset;
  unlockDatasets: typeof import("../src/app/[communitySlug]/protected/[id]/actions").unlockDatasets;
  getProtectedDataset: typeof import("../src/lib/protected-dataset").getProtectedDataset;
  access: typeof import("../src/lib/protected-access");
  restoreCommunity: typeof import("../src/app/create-community/actions").restoreCommunity;
  backupRoute: typeof import("../src/app/admin/[communitySlug]/backup/route").GET;
};
export let m: Modules;

// Call once per test file: prepares the database and loads the app modules.
export function setupTestEnv() {
  beforeAll(setup, 120_000);
}

async function setup() {
  const admin = new Client({ connectionString: baseUrl });
  await admin.connect();
  const exists = await admin.query("select 1 from pg_database where datname = 'sirkel_test'");
  if (exists.rowCount === 0) await admin.query("create database sirkel_test");
  await admin.end();

  const migrate = Bun.spawnSync(["bunx", "prisma", "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: testUrl },
  });
  if (migrate.exitCode !== 0) throw new Error(migrate.stderr.toString());

  process.env.DATABASE_URL = testUrl;
  const { getDb } = await import("../src/lib/db");
  m = {
    auth: (await import("../src/lib/auth")).auth,
    db: getDb(),
    createCommunity: (await import("../src/app/create-community/actions")).createCommunity,
    users: await import("../src/app/admin/[communitySlug]/users/actions"),
    settings: await import("../src/app/admin/[communitySlug]/settings/actions"),
    changePassword: (await import("../src/app/change-password/actions")).changePassword,
    requireMember: (await import("../src/lib/access")).requireMember,
    requireUser: (await import("../src/lib/session")).requireUser,
    announcements: await import("../src/app/admin/[communitySlug]/announcements/actions"),
    events: await import("../src/app/admin/[communitySlug]/events/actions"),
    contacts: await import("../src/app/admin/[communitySlug]/contacts/actions"),
    getPublicContent: (await import("../src/lib/public-content")).getPublicContent,
    publicDetail: await import("../src/lib/public-detail"),
    datasets: await import("../src/app/admin/[communitySlug]/datasets/actions"),
    exportAll: (await import("../src/app/admin/[communitySlug]/datasets/export/route")).GET,
    exportCsv: (await import("../src/app/admin/[communitySlug]/datasets/[id]/export/route")).GET,
    getPublicDataset: (await import("../src/lib/public-dataset")).getPublicDataset,
    unlockDatasets: (await import("../src/app/[communitySlug]/protected/[id]/actions")).unlockDatasets,
    getProtectedDataset: (await import("../src/lib/protected-dataset")).getProtectedDataset,
    access: await import("../src/lib/protected-access"),
    restoreCommunity: (await import("../src/app/create-community/actions")).restoreCommunity,
    backupRoute: (await import("../src/app/admin/[communitySlug]/backup/route")).GET,
  };
  await m.db.$executeRawUnsafe('TRUNCATE "user", "communities", "rateLimit" CASCADE');
  jar.clear();
  forwardedFor = "";
}

// --- Helpers ----------------------------------------------------------------

// The JSON an editor field would submit for these lines of text.
export const doc = (text: string) => JSON.stringify(textToDoc(text));
export const PASSWORD = "password-awal-1";
export const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};
export const rejects = async (promise: Promise<unknown>, message: string) => {
  let error: unknown;
  try {
    await promise;
  } catch (e) {
    error = e;
  }
  expect((error as Error | undefined)?.message).toBe(message);
};

export async function register(username: string, approved = true) {
  await m.auth.api.signUpEmail({
    body: {
      email: `${username}@users.sirkel.local`,
      password: PASSWORD,
      name: username,
      username,
    },
  });
  if (approved)
    await m.db.user.update({ where: { username }, data: { approved: true } });
}

export async function login(username: string, password = PASSWORD) {
  const { headers } = await m.auth.api.signInUsername({
    body: { username, password },
    returnHeaders: true,
  });
  jar.clear();
  for (const setCookie of headers.getSetCookie()) {
    const [pair] = setCookie.split(";");
    const index = pair.indexOf("=");
    jar.set(pair.slice(0, index), pair.slice(index + 1));
  }
}
