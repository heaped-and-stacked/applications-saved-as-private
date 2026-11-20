/** The ASAP mark: a lightning bolt (urgency) on a blue square, with an amber square behind it. */
export default function Logo() {
  return (
    <svg class="logo" viewBox="0 0 32 32" width="26" height="26" aria-hidden="true">
      <rect x="7" y="7" width="24" height="24" rx="6" fill="var(--warn)" />
      <rect x="1" y="1" width="24" height="24" rx="6" fill="var(--accent)" />
      <path d="M15 4.5 7.5 14.5h5l-2 7 8-10.5h-5z" fill="var(--bg)" />
    </svg>
  );
}
