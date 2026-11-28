# Product

## Purpose

ASAP records job applications for one person. It records the applications, their rounds, the result of each round, and the end of each application.

All data is one JSON document. The document is in the browser. If the user signs in with Google, a copy is also in the user's Google Drive. There is no server and no database.

## Users

One person who looks for a job. This person follows many applications at the same time, for weeks or months. They use ASAP on a computer. They use it on a phone to read the details of a round before the round starts.

## Principles

- The user owns the data. The user can download the document as one file and upload it again at any time.
- The app shows facts. It does not tell the user what to do. A hint can suggest an action, but it does not give a command or ask a question.
- The rounds give the stage of an application. The user selects only the end of an application.
- The same pop-up adds and edits an item. It shows the same fields in both cases.
- A feature is added only when real use shows that it is necessary.
- The app does not overwrite data without the user's decision. The user can undo that decision.

## Scope

- Applications: details, the job listing, and fields that the user adds.
- Rounds: type, date and time, outcome, and debrief.
- Notes: dated notes for each application.
- Home: active applications, closed applications, a summary, and a calendar of rounds.
- Download and upload of the document, and import from Job Hunt Command Center.
- Sync with the user's Google Drive. This is optional.

## Out of scope

- Accounts, servers, or copies of the data outside the browser and the user's Drive.
- Shared documents or work by more than one person.
- Automatic merge of two copies of the data.
- Advice, scores, or reminders outside the app.
- Search or import of job listings from job sites.

## Decisions

| Decision | Reason |
|---|---|
| No server and no database | The data is small and is for one person. A server costs money and holds sensitive data for other people. |
| One JSON document | The user can download, keep, and move one file. The format has a version, so old files stay readable. See [Model](model.md). |
| The browser copy is the working copy. Drive sync is an added layer. | There is one data path. The app works without sign-in and without a connection. |
| The user syncs with a Sync button | The user decides when Drive changes. Google requires a click to renew the sign-in, so automatic sync cannot run alone. |
| Drive with the `drive.file` permission | ASAP can see only the files that it creates. The file is visible in the user's Drive. |
| No merge after a conflict | A merge of free text must guess what the user wants. The user selects one copy and can undo the selection. |
| The rounds give the stage. Only the end is stored. | A stage that the user sets by hand repeats the rounds and becomes incorrect over time. |
| Five ends: Hired, Rejected, Withdrew, No reply, Position closed | These are the ends that occur. Position closed is for an end that is not about the user: the role is filled, the listing is removed, or hiring stops. |
| Four round types: Screening, Technical, Offer, Other | These are the usual steps. Other is for all other rounds. |
| Only active applications have a color. Closed applications are grey. | The app gives the color of a closed application to the next new application. A color identifies one application on the screen. |
| Normal URLs, not hash URLs | GitHub Pages sends a copy of the page for each path. |
| Static hosting on GitHub Pages | There is no cost and no server. Each push to `main` deploys after the tests pass. |
| SolidJS 2 and TypeScript | Its fine-grained updates suit one document that the app shows in many places. |
