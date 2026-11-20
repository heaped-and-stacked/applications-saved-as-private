// JSON download and upload: the way out and back in, always available.
import { readDocument, writeDocument, type Loaded } from './document';
import { today, type AsapDocument } from './model';

export function downloadDocument(document: AsapDocument): void {
  const blob = new Blob([writeDocument(document)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  link.href = url;
  link.download = `asap-${today()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function readFile(file: File): Promise<Loaded> {
  let json: unknown;
  try {
    json = JSON.parse(await file.text());
  } catch {
    throw new Error('This file is not valid JSON.');
  }
  return readDocument(json);
}
