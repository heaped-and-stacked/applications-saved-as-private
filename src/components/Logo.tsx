/** The ASAP mark: an application, as a card with a check mark, on a second card behind it. */
export default function Logo() {
  return (
    <svg class="logo" viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
      <rect x="9" y="3" width="19" height="25" rx="4" fill="var(--warn)" transform="rotate(10 18.5 15.5)" />
      <rect x="4" y="4" width="19" height="25" rx="4" fill="var(--accent)" />
      <rect x="8" y="9" width="11" height="2.4" rx="1.2" fill="var(--bg)" />
      <rect x="8" y="14" width="8" height="2.4" rx="1.2" fill="var(--bg)" opacity=".55" />
      <path
        d="M8.5 21.5l2.5 2.5 5-5"
        fill="none"
        stroke="var(--bg)"
        stroke-width="2.4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  );
}
