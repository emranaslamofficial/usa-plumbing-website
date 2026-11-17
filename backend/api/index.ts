// Vercel serverless entry point: the whole Express API runs as one function.
// vercel.json rewrites every non-static path (/api/v1/*, /health, /) to this function.
// Locally the same app runs as a normal server via src/server.ts.
import { createApp } from "../src/app.js";

export default createApp();
