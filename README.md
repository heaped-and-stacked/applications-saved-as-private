# ASAP - Applications Saved as Private

A job application tracker where your data is one file you own. No server, no database, and no account other than your own Google account, which is optional.

## Motivation

Searching for a job usually means following several leads in parallel. I wanted a way to keep my applications organized,
know the state of each one and its notes, see a quick timeline of my schedule, and write down what to prepare and how it went.
OneNote and Google Calendar have helped me so far, but I thought I could use a better way to organize this kind of activity.

Before building anything, I looked at what solutions are already out there. I found a couple of apps, like Teal and Huntr, and gave them a try.
Both of them offered way more features than I needed, and both of them store your data on their side.
It isn't necessarily public, but this kind of data is definitely sensitive, and I would like to own it as much as I can.

This project started off as a small experiment in building my own tools, called Job Hunt Command Center, and I wanted to see how it behaves when hosted fully on free tiers.
I initially hosted it on Render with a free Postgres instance, but then I asked myself whether I actually need a server and a database, or if there is a simpler way to do this.

I heard Solid 2.0 came out recently, so I decided to give it a try and rework the app with it: a static web page that manages this data and
syncs it through the Google account you sign in with.

## What it does

- **Applications**: company, role, location, work mode, applied date, link, the job listing as pasted (links expire), and custom fields when you need them, like a salary.
- **Rounds**: screening, technical, offer, or other, with a date and time. After a round, a debrief: how it felt, how hard it was, what was asked and what you answered.
- **Notes**: short, dated notes per application. How it started, what to prepare, anything to remember.
- **Home**: active applications ordered by last activity, a calendar of rounds by week or month, and a short summary on top. Each application has its own color everywhere.
- **Closing**: when an application ends, close it as hired, rejected, withdrew, no reply, or position closed (the role was filled or pulled). It moves out of the way.
- **Your data, as a file**: download everything as one JSON file, and upload it back. This also imports exports from Job Hunt Command Center.
- **Light and dark**, following your system setting.

## Where your data lives

- **In your browser.** ASAP saves everything in the browser's storage. It works without signing in and without a connection.
- **In your Google Drive.** Sign in with Google, press **Sync**, and your document is saved as one file in your own Drive (folder `ASAP`, file `asap-data.json`). On another device, like your phone, sign in and press Sync to get it. ASAP only asks for access to files it creates (`drive.file`), so it can't see anything else in your Drive. If both sides changed, ASAP asks which one to keep. It never merges.
- **Nowhere else.** There are no cookies, analytics or tracking. The details are on the app's Privacy page.

Keep a downloaded copy now and then. ASAP comes as is, without warranty.

## Running it locally

You need Node.js 22.12 or newer.

```sh
npm install
npm run dev       # http://localhost:3000
```

Other commands:

```sh
npm test          # unit tests (Vitest)
npm run check     # type check (TypeScript)
npm run lint      # lint (oxlint with the Solid rules)
npm run build     # static site in dist/client
npm run verify    # all of the above, before pushing
```

To keep dependencies current: `npm outdated` shows what's behind, `npm update` takes minor and patch versions.

## How it's built

- [SolidJS 2](https://v2.solidjs.com) with [Solid Router](https://github.com/solidjs/solid-router), TypeScript and Vite.
- One document in memory, saved to the browser on every change. Drive sync is a layer on top of that, not a second way of storing data.
- Plain functions for the rules (where each application stands, sync decisions), with unit tests.

The data format is versioned. New fields are only added, never renamed, and fields the app doesn't know are kept, so older files keep working.

## Google Drive sync setup

Drive sync needs an OAuth client ID from Google Cloud: a web client, with the Drive API enabled and only the `drive.file` scope. Put it in `googleClientId` in `src/site.ts`. It's not a secret. Without it, the Sign in button stays disabled and the app works offline.

## Deployment

Every push to `main` builds, tests and publishes the site to GitHub Pages (`.github/workflows/deploy.yml`). The repository's Pages source must be set to GitHub Actions. ASAP must live at the root of its address (a custom domain or subdomain), not under a sub-path.

