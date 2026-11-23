import type { ParentProps } from 'solid-js';

// The HTML shell (what index.html used to be). It is rendered once at build
// time and ships no JavaScript of its own.
export default function Document(props: ParentProps) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="A job application tracker. Your data is one JSON file you own." />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        {/* The icon a phone uses when ASAP is added to the home screen. */}
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#15171c" />
        <title>ASAP</title>
      </head>
      <body>{props.children}</body>
    </html>
  );
}
