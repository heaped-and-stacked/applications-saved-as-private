# Flows

## Screens

| Screen | Path | Content |
|---|---|---|
| Home | `/` | Summary (Active, Next round, This week, Gone quiet), Active list, Closed list (collapsed, 20 rows for each "Show more"), calendar (week or month). |
| Application page | `/applications/:id` | Back link to Home, header (company, role, facts, stepper), Edit, Close application… or Reopen, upcoming rounds, past rounds, notes, listing (collapsed). |
| About | `/about` | What ASAP is, where the data is, how to give feedback. |
| Privacy | `/privacy` | The privacy policy. The "Last updated" date comes from git. |
| Not found | other paths | A link to Home. |

### Top bar

Logo (link to Home), today's date, sync status, Sync, Sign out, theme, Download, Upload.

### Footer

About, Privacy, Feedback, Donate.

### Pop-ups

| Pop-up | Opens from | Fields or content |
|---|---|---|
| Application | Add application, Edit | Company, role, location, work mode, applied date, link, extras, listing. Add only: first note. Edit only: Delete. Enter does not save. |
| Round | Add round, a round | Type, day, time, outcome, felt, difficulty, questions, thoughts. |
| Note | Add note, a note | Date, text. |
| Close application | Close application… | The five results, the closed date. |
| Close as Rejected | A round saved as Failed | Close as Rejected, Keep open. |
| Conflict | Sync | Differences for each application. Keep this browser's, Keep Drive's, Cancel. |
| Account switch | Sign in or Sync with another account | Remove local data, Keep local data, Cancel. |
| Sign out | Sign out | Keep the data in this browser, or remove it. |
| Welcome | First visit | What ASAP is, where the data is, Add application, Upload a file. |

### Empty states

| Place | Text |
|---|---|
| Active list | No active applications. |
| Closed list | Hidden when empty. |
| Calendar | The grid shows with no entries. |
| Rounds | No rounds yet. |
| Notes | No notes yet. |

## First visit

```mermaid
flowchart TD
    A[Open ASAP] --> B{Data in this browser?}
    B -- Yes --> H[Home]
    B -- No --> W[Welcome pop-up]
    W -- Add application --> P[Application pop-up]
    W -- Upload a file --> U[Upload]
    W -- Sign in with Google --> S[Sign in]
    W -- Close --> H
    P --> H
    U --> H
    S --> D{File in Drive?}
    D -- Yes --> R[Read Drive copy] --> H
    D -- No --> H
```

The welcome pop-up shows one time for each browser. About shows the same text.

## Add an application

```mermaid
flowchart TD
    H[Home] --> A[Add application]
    A --> P[Application pop-up]
    P -- Save --> N{Note written?}
    N -- Yes --> C[Add application with note]
    N -- No --> C2[Add application]
    C --> AP[Application page]
    C2 --> AP
    P -- Cancel --> H
```

The new application gets the first free color slot and goes to the top of the Active list.

## Plan and record a round

```mermaid
flowchart TD
    AP[Application page] --> R[Add round]
    R --> F[Round pop-up: type, day, time]
    F -- Save --> UP[Upcoming rounds]
    UP -- after the round --> E[Open the round]
    E --> D[Set outcome, write debrief]
    D -- Save --> O{Outcome}
    O -- Passed / Pending / Cancelled --> AP
    O -- Failed --> Q[Close as Rejected pop-up]
    Q -- Close as Rejected --> CL[Application closed, result Rejected]
    Q -- Keep open --> AP
```

A round without a day is in Upcoming rounds with "Not planned". Upcoming rounds are first on the page, with the nearest first. Past rounds follow, with the newest first.

## Close and reopen

```mermaid
flowchart TD
    AP[Application page] --> C[Close application…]
    C --> P[Close pop-up: result, closed date]
    P -- Close --> X[Closed: grey, moves to Closed list]
    P -- Cancel --> AP
    X --> R[Reopen]
    R --> A[Active: color slot back or first free slot]
```

## Before a round, on a phone

```mermaid
flowchart TD
    H[Home] --> S[Summary: Next round]
    S --> AP[Application page]
    H --> C[Card: next round line] --> AP
    AP --> U[Upcoming rounds at the top]
    U --> L[Listing, notes, past debriefs]
```

## Sync on a new device

```mermaid
flowchart TD
    A[Open ASAP] --> S[Sign in with Google]
    S --> L{Data in this browser?}
    L -- No --> D{File in Drive?}
    D -- Yes --> R[Read Drive copy] --> OK[Synced]
    D -- No --> W[Write a new file to Drive] --> OK
    L -- Yes --> D2{File in Drive?}
    D2 -- No --> W
    D2 -- Yes --> C[Conflict pop-up]
```

## Conflict

```mermaid
flowchart TD
    S[Sync] --> T{What changed since the last sync?}
    T -- Nothing --> OK[Synced]
    T -- This browser only --> W[Write to Drive] --> OK
    T -- Drive only --> R[Read Drive copy] --> OK
    T -- Both --> C[Conflict pop-up: differences for each application]
    C -- Keep this browser's --> W2[Write to Drive. Keep Drive copy for Undo] --> M[Message with Undo]
    C -- Keep Drive's --> R2[Read Drive copy. Keep browser copy for Undo] --> M
    C -- Cancel --> N[Not synced]
    M -- Undo --> B[Restore the kept copy. Not synced]
    M -- no action --> OK
```

Upload and the delete of an application also keep the replaced copy and show a message with Undo.

## Account switch

```mermaid
flowchart TD
    S[Sign in or Sync] --> A{Same account as last sync?}
    A -- Yes or no earlier sync --> N[Normal sync]
    A -- No --> P[Account switch pop-up]
    P -- Remove local data --> R[Read the new account's Drive copy]
    P -- Keep local data --> C[Sync the local data with the new account]
    P -- Cancel --> O[Signed out, data not changed]
```

## Several tabs

```mermaid
sequenceDiagram
    participant A as Tab A
    participant L as localStorage
    participant B as Tab B
    A->>L: Write asap.document
    L-->>B: storage event
    B->>B: Show the new document
    A->>A: Sync
    A->>L: Write asap.sync
    L-->>B: storage event
    B->>B: Show Synced
```

All tabs show the same data and the same sync state. A Sync in any tab syncs the same document.
