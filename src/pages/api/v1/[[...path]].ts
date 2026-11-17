import type { NextApiRequest, NextApiResponse } from "next";
import { createApp } from "../../../../backend/src/app";

/**
 * The whole CMS/admin backend (backend/src) runs inside this Next.js server:
 * every request to /api/v1/* is handed to the Express app, so the website, the
 * admin panel (/admin) and the API share one server and one domain.
 *
 * Pages-Router API routes give Express the real Node request/response objects.
 */
export const config = {
  api: {
    bodyParser: false, // Express parses JSON / multipart / raw (webhook signatures) itself
    externalResolver: true, // Express sends the response
    responseLimit: false, // CSV exports can be large
  },
  maxDuration: 30, // seconds (Vercel) — keyword imports and image processing can take a while
};

let app: ReturnType<typeof createApp> | undefined;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  app ??= createApp();
  return new Promise<void>((resolve) => {
    res.on("finish", resolve);
    res.on("close", resolve);
    app!(req, res);
  });
}
