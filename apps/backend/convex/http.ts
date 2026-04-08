import { httpRouter } from "convex/server";

import { auth } from "./auth";

// Mounts /api/auth/* HTTP routes that handle OAuth redirects, code exchange,
// and token issuance for @convex-dev/auth.
const http = httpRouter();
auth.addHttpRoutes(http);

export default http;
