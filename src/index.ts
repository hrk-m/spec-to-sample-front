import { serve } from "bun";

import index from "./index.html";
import { handleApiProxy } from "./proxy";

const DEFAULT_PORT = 3000;
const DEFAULT_API_UPSTREAM = "http://localhost:8080";

function resolvePort(value: string | undefined): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isNaN(parsed) ? DEFAULT_PORT : parsed;
}

const API_UPSTREAM = process.env.API_UPSTREAM_URL || DEFAULT_API_UPSTREAM;
const port = resolvePort(process.env.PORT);

const server = serve({
  port,
  routes: {
    "/api/*": (req) => handleApiProxy(req, API_UPSTREAM),
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

process.stdout.write(`Server running at ${server.url}\n`);
