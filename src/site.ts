// Settings for this copy of ASAP. Empty means the feature is off.
export const SITE = {
  /** The donations page ASAP shares with Heaped & Stacked. */
  donateUrl: 'https://buymeacoffee.com/heapedstacked',
  /** Where people report bugs and suggest ideas: the repository's GitHub issues. */
  feedbackUrl: 'https://github.com/heaped-and-stacked/applications-saved-as-private/issues/new/choose',
  /** For feedback from people without a GitHub account. Also the support email on Google's consent screen. */
  feedbackEmail: 'hello@heapedstacked.dev',
  /** Every earlier version of the Privacy page, in the public repository. */
  privacyHistoryUrl: 'https://github.com/heaped-and-stacked/applications-saved-as-private/commits/main/src/pages/Privacy.tsx',
  /**
   * The OAuth client ID from Google Cloud, for Drive sync. Not a secret: it is
   * public in every web app that uses Google sign-in. Empty disables sign-in.
   */
  googleClientId: '998000574371-0s159ice1akc209ccanr3m0tbnhshps4.apps.googleusercontent.com',
};
