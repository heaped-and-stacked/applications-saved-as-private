import { onSettled, type ParentProps } from 'solid-js';

/**
 * A pop-up over the page, using the browser's own <dialog>: it keeps focus
 * inside and closes on Esc. Render it only while it is open.
 */
export default function Modal(props: ParentProps<{ title: string; onClose: () => void }>) {
  let dialog!: HTMLDialogElement;
  // The dialog must be in the page before it can open as a modal.
  onSettled(() => dialog.showModal());

  return (
    // Esc fires "cancel": close through the parent, so its state stays in step.
    <dialog
      ref={dialog}
      onCancel={(event) => {
        event.preventDefault();
        props.onClose();
      }}
    >
      <h2 class="dialog-title">{props.title}</h2>
      {props.children}
    </dialog>
  );
}
