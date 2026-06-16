import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const PROJECT = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || 'gramos-app';

let client: SecretManagerServiceClient | null = null;
function sm(): SecretManagerServiceClient {
  return client ?? (client = new SecretManagerServiceClient());
}

// Small per-instance cache so we don't hit Secret Manager on every invocation.
const cache: Record<string, { val: string; exp: number }> = {};
const TTL_MS = 60_000;

/** Reads the LATEST version of a secret at runtime (so UI updates apply without redeploy). */
export async function getLatestSecret(name: string): Promise<string | null> {
  const now = Date.now();
  const hit = cache[name];
  if (hit && hit.exp > now) return hit.val;
  try {
    const [v] = await sm().accessSecretVersion({
      name: `projects/${PROJECT}/secrets/${name}/versions/latest`,
    });
    const val = v.payload?.data?.toString();
    if (val) {
      cache[name] = { val, exp: now + TTL_MS };
      return val;
    }
    return null;
  } catch {
    return null; // caller falls back to the deploy-bound secret
  }
}

/** Adds a new version to a secret (used by the admin Stripe config UI). */
export async function addSecretVersion(name: string, value: string): Promise<void> {
  await sm().addSecretVersion({
    parent: `projects/${PROJECT}/secrets/${name}`,
    payload: { data: Buffer.from(value, 'utf8') },
  });
  delete cache[name]; // invalidate this instance's cache
}
