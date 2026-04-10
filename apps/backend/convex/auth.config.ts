// @ts-expect-error — `process.env` exists at runtime in the Convex environment
const siteUrl: string = process.env.CONVEX_SITE_URL;

export default {
  providers: [
    {
      domain: siteUrl,
      applicationID: "convex",
    },
  ],
};
