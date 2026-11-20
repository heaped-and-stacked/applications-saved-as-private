import { Show } from 'solid-js';
import { SITE } from '../site';

// Keep this page true to what the app does. When something changes, the date changes.
export default function Privacy() {
  return (
    <article class="legal">
      <h1>Privacy</h1>
      <p class="muted">Last updated: 20 November 2026</p>

      <h2>Your data stays with you</h2>
      <p>
        ASAP has no server and no database. Everything you write (applications, listings, salaries, rounds, debriefs
        and notes) is one document that only you hold: in this browser, and, if you sign in, as a file in your own
        Google Drive. Nobody else can see it, including the people who make ASAP.
      </p>

      <h2>In this browser</h2>
      <p>
        ASAP saves your data in this browser's storage, so it works without signing in and without a connection. Besides
        your data, it keeps a few display choices, such as week or month in the calendar. There are no cookies,
        analytics, ads or tracking.
      </p>

      <h2>Google Drive sync (coming soon)</h2>
      <ul>
        <li>
          After you sign in with Google, <strong>Sync</strong> saves your document as one file in your Google Drive
          (folder ASAP, file asap-data.json), and loads changes made on your other devices, including your phone. The
          file is visible in your Drive like any other.
        </li>
        <li>
          ASAP asks only for access to files it creates (Google calls this permission <code>drive.file</code>). It
          cannot see or change anything else in your Drive.
        </li>
        <li>
          You sign in on Google's own page. ASAP never sees your password, and gets only a short-lived permission to
          read and write its own file.
        </li>
        <li>Your browser talks to Google directly. There is no ASAP server in between.</li>
        <li>
          You can remove ASAP's access at any time in your Google Account, under third-party connections. Your file
          stays in your Drive until you delete it.
        </li>
        <li>
          ASAP's use of information received from Google APIs follows the Google API Services User Data Policy,
          including its Limited Use requirements.
        </li>
      </ul>

      <h2>What else leaves your device</h2>
      <ul>
        <li>
          The site is hosted on GitHub Pages. Like any website, GitHub sees your IP address when your browser loads the
          page, and may log it for security, under its own privacy policy.
        </li>
        <Show when={SITE.donateUrl}>
          <li>
            The coffee link opens Buy Me a Coffee. What you share there is handled by Buy Me a Coffee and its payment
            provider, under their own privacy policies.
          </li>
        </Show>
      </ul>

      <h2>Keeping a copy</h2>
      <p>
        <strong>Download</strong> saves all your data as one JSON file, and <strong>Upload</strong> loads it back. Keep
        a recent download if your data matters to you: ASAP comes as is, without warranty.
      </p>

      <h2>Changes</h2>
      <p>If this page changes, the date at the top changes too.</p>
    </article>
  );
}
