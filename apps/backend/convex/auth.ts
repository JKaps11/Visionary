import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";

// Convex Auth — Google sign-in only.
//
// Required Convex env vars (set with `bunx convex env set <KEY> <VALUE>`):
//   AUTH_GOOGLE_ID      — Google OAuth client id
//   AUTH_GOOGLE_SECRET  — Google OAuth client secret
//   SITE_URL            — convex deployment URL (.convex.cloud), used as
//                          the OAuth redirect host
//
// The Google OAuth client must list the convex `.convex.site/api/auth/callback/google`
// endpoint as an authorized redirect URI.

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google],
});
