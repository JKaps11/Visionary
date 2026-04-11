import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";

// Convex Auth — Google sign-in only.
//
// Required Convex env vars (set with `bunx convex env set <KEY> <VALUE>`):
//   AUTH_GOOGLE_ID      — Google OAuth client id
//   AUTH_GOOGLE_SECRET  — Google OAuth client secret
//
// The Google OAuth client must list the convex `.convex.site/api/auth/callback/google`
// endpoint as an authorized redirect URI.

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google],
  callbacks: {
    async redirect({ redirectTo }) {
      // Allow the mobile app's custom URL scheme.
      if (redirectTo.startsWith("visionary://")) {
        return redirectTo;
      }
      // Default: allow relative paths and same-origin URLs.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const siteUrl = ((globalThis as any).process.env.SITE_URL as string).replace(/\/$/, "");
      if (
        redirectTo.startsWith("?") ||
        redirectTo.startsWith("/") ||
        redirectTo.startsWith(siteUrl)
      ) {
        return redirectTo.startsWith(siteUrl)
          ? redirectTo
          : `${siteUrl}${redirectTo}`;
      }
      throw new Error(
        `Invalid \`redirectTo\` ${redirectTo} for configured SITE_URL: ${siteUrl}`,
      );
    },
  },
});
