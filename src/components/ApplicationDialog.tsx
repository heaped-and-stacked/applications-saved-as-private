import { useContext } from 'solid-js';
import ApplicationForm, { type ApplicationFields } from './ApplicationForm';
import Modal from './Modal';
import { freeSlot } from '../data/color';
import { newId, today, type Application } from '../data/model';
import { DataContext } from '../data/store';

/**
 * The pop-up to add an application, or, with `application`, to edit it.
 * Both show the same fields. `onSaved` gets the id of the saved application.
 */
export default function ApplicationDialog(props: {
  application?: Application;
  onClose: () => void;
  onSaved?: (id: string) => void;
  onDelete?: () => void;
}) {
  const data = useContext(DataContext);

  function save(fields: ApplicationFields, note: string) {
    const existing = props.application;
    if (existing) {
      data.updateApplication(existing.id, (app) => Object.assign(app, fields));
      props.onSaved?.(existing.id);
    } else {
      const id = newId();
      const now = new Date().toISOString();
      data.update((draft) => {
        draft.applications.push({
          id,
          ...fields,
          result: '',
          closedDate: '',
          color: freeSlot(draft.applications),
          createdAt: now,
          updatedAt: now,
          rounds: [],
          // The first note, written in the same form, is dated the day of applying.
          notes: note ? [{ id: newId(), date: fields.appliedDate || today(), text: note }] : [],
        });
      });
      props.onSaved?.(id);
    }
    props.onClose();
  }

  return (
    <Modal title={props.application ? 'Edit application' : 'New application'} onClose={props.onClose}>
      <ApplicationForm
        application={props.application}
        onSave={save}
        onCancel={props.onClose}
        onDelete={props.onDelete}
      />
    </Modal>
  );
}
