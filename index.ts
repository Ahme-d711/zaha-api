import app from "./app.js";
import { env } from "./config/env.js";
import { ensureServerReady } from "./bootstrap.js";

const PORT = env.port;

async function start(): Promise<void> {
  try {
    await ensureServerReady();
    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(
        `Swagger documentation available at http://localhost:${PORT}/api-docs`
      );
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

if (!process.env.VERCEL) {
  start();
}

export default app;
