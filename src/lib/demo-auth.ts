import crypto from "node:crypto";
import { cookies } from "next/headers";

export const DEMO_EMAIL = process.env.DEMO_EMAIL || "demo@foodflow.local";
export const DEMO_PASSWORD = process.env.DEMO_PASSWORD || "DemoFoodFlow2026!";
const DEMO_SESSION_COOKIE = "foodflow_demo_session";
const DEMO_SESSION_SECRET =
  process.env.DEMO_SESSION_SECRET || "foodflow-demo-secret-2026";

function createSignature(value: string) {
  return crypto
    .createHmac("sha256", DEMO_SESSION_SECRET)
    .update(value)
    .digest("hex");
}

export function createDemoSessionValue(email: string) {
  const payload = `${email}:${createSignature(email)}`;
  return Buffer.from(payload).toString("base64url");
}

export function validateDemoSessionValue(value?: string | null) {
  if (!value) return false;
  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8");
    const [email, sig] = decoded.split(":");
    return email === DEMO_EMAIL && sig === createSignature(email);
  } catch {
    return false;
  }
}

export async function hasDemoSession() {
  const store = await cookies();
  return validateDemoSessionValue(store.get(DEMO_SESSION_COOKIE)?.value);
}

export { DEMO_SESSION_COOKIE };
