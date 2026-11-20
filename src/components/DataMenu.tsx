import { useContext } from 'solid-js';
import { DataContext } from '../data/store';
import { downloadDocument, readFile } from '../data/files';

/** Download and upload buttons for the JSON file. */
export default function DataMenu() {
  const data = useContext(DataContext);
  let input!: HTMLInputElement;

  async function upload(file: File) {
    try {
      const loaded = await readFile(file);
      const count = loaded.document.applications.length;
      const current = data.doc.applications.length;
      const question =
        `Replace the data in this browser with ${file.name}?\n\n` +
        `The file has ${plural(count, 'application')}. ` +
        `The ${plural(current, 'application')} here now will be replaced.`;
      // Nothing to lose when this browser has no applications yet.
      if (current > 0 && !window.confirm(question)) return;
      data.replace(loaded);
      if (loaded.readOnly) {
        data.setNotice('This file is from a newer version of ASAP. You can look, but changes are not saved.');
      } else if (loaded.converted) {
        data.setNotice(`Imported ${plural(count, 'application')} from Job Hunt Command Center.`);
      } else {
        data.setNotice(`Loaded ${plural(count, 'application')} from ${file.name}.`);
      }
    } catch (error) {
      data.setNotice(error instanceof Error ? error.message : 'The file could not be read.');
    }
  }

  return (
    <>
      <button type="button" onClick={() => downloadDocument(data.doc)} title="Save all your data as a JSON file">
        Download
      </button>
      <button type="button" onClick={() => input.click()} title="Load data from a JSON file">
        Upload
      </button>
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = '';
          if (file) void upload(file);
        }}
      />
    </>
  );
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}
