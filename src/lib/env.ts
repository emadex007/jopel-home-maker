// Typed access to the Cloudflare bindings declared in wrangler.toml.
import { env as cfEnv } from "cloudflare:workers";

export interface AppEnv {
  DB: D1Database;
  MEDIA: R2Bucket;
  SITE_ENV?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM?: string; // e.g. "Jo-pearl Home Maker <hello@yourdomain.com>"
  ADMIN_NOTIFY_EMAIL?: string;
}

export const env = cfEnv as unknown as AppEnv;
