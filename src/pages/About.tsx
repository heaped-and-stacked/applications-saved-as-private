import { SITE } from '../site';

// The public description of ASAP. Also the home page on Google's sign-in
// consent screen, which must describe the app and link to the privacy policy.
export default function About() {
  return (
    <article class="legal">
      <h1>ASAP - Applications Saved as Private</h1>
      <p>
        A free job application tracker where your data is one file you own. No server, no database, and no account
        other than your own Google account, which is optional.
      </p>

      <h2>What it does</h2>
      <ul>
        <li>Keeps your applications: company, role, location, the job listing, and any fields you add, like a salary.</li>
        <li>Tracks the rounds of each one, with a debrief after each round: how it went and what you were asked.</li>
        <li>Holds short, dated notes per application.</li>
        <li>Shows your active applications by last activity, and a calendar of rounds by week or month.</li>
        <li>Lets you close an application as hired, rejected, withdrew, no reply, or position closed.</li>
      </ul>

      <h2>Where your data lives</h2>
      <p>
        In your browser, and, if you sign in with Google, as one file in your own Google Drive. ASAP asks Google only
        for access to the files it creates, so it can't see anything else in your Drive. Your data is never sent
        anywhere else. The details are on the <a class="link" href="/privacy">Privacy</a> page.
      </p>
      <p>
        On a shared computer, give each person their own browser profile, or sign out with "remove the data from this
        browser" when you're done.
      </p>

      <h2>Start</h2>
      <p>
        <a class="link" href="/">Open ASAP</a>. It works right away, without signing in. Bugs and ideas are welcome
        on{' '}
        <a class="link" href={SITE.feedbackUrl} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        , or by email to{' '}
        <a class="link" href={`mailto:${SITE.feedbackEmail}`}>
          {SITE.feedbackEmail}
        </a>
        .
      </p>
    </article>
  );
}
