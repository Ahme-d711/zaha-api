import { connectDatabase } from "./config/database.js";
import { initDefaultAdmin } from "./utils/initDefaultAdmin.js";

let readyPromise: Promise<void> | null = null;

/** Single-flight init for local server and Vercel serverless invocations. */
export function ensureServerReady(): Promise<void> {
  if (!readyPromise) {
    readyPromise = (async () => {
      await connectDatabase();
      await initDefaultAdmin();
    })();
  }
  return readyPromise;
}
