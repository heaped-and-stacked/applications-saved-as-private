// The copy of the document in the user's Google Drive: one file,
// "asap-data.json", in a folder "ASAP" in their My Drive.
//
// Remote is the small interface the sync logic uses, so tests can use a fake.
// driveRemote is the real one, talking to the Drive REST API (v3) directly
// from the browser. With the drive.file permission, ASAP only sees files it
// created itself.

export interface RemoteFile {
  id: string;
  /** Drive's version number for the file: it goes up on every change. */
  version: string;
}

export interface Remote {
  /** The email address of the signed-in account. */
  account(): Promise<string>;
  /** The file's current id and version, or null if it doesn't exist (or was trashed). */
  find(knownId: string | null): Promise<RemoteFile | null>;
  read(id: string): Promise<string>;
  /** Creates the file (and its folder, if needed) with this content. */
  create(json: string): Promise<RemoteFile>;
  update(id: string, json: string): Promise<RemoteFile>;
}

const API = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
const FOLDER_NAME = 'ASAP';
const FILE_NAME = 'asap-data.json';
const FOLDER_TYPE = 'application/vnd.google-apps.folder';
const FIELDS = 'id,version,trashed';

/** The real Remote. `token` gives a valid access token, asking the user to sign in if needed. */
export function driveRemote(token: () => Promise<string>): Remote {
  async function call(url: string, init: RequestInit = {}): Promise<Response> {
    const response = await fetch(url, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${await token()}` },
    });
    if (!response.ok && response.status !== 404) {
      throw new Error(`Google Drive answered ${response.status}. Try again in a moment.`);
    }
    return response;
  }

  async function search(query: string): Promise<{ id: string; version: string }[]> {
    const params = new URLSearchParams({ q: `${query} and trashed = false`, fields: `files(${FIELDS})`, orderBy: 'modifiedTime desc' });
    const body = await (await call(`${API}/files?${params}`)).json();
    return body.files ?? [];
  }

  async function folderId(): Promise<string> {
    const [folder] = await search(`name = '${FOLDER_NAME}' and mimeType = '${FOLDER_TYPE}'`);
    if (folder) return folder.id;
    const response = await call(`${API}/files?fields=id`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: FOLDER_NAME, mimeType: FOLDER_TYPE }),
    });
    return (await response.json()).id;
  }

  return {
    async account() {
      const body = await (await call(`${API}/about?fields=user(emailAddress)`)).json();
      return body.user?.emailAddress ?? '';
    },

    async find(knownId) {
      if (knownId) {
        const response = await call(`${API}/files/${knownId}?fields=${FIELDS}`);
        if (response.ok) {
          const file = await response.json();
          if (!file.trashed) return { id: file.id, version: file.version };
        }
      }
      const [file] = await search(`name = '${FILE_NAME}' and mimeType = 'application/json'`);
      return file ? { id: file.id, version: file.version } : null;
    },

    async read(id) {
      return (await call(`${API}/files/${id}?alt=media`)).text();
    },

    async create(json) {
      // A multipart upload: the file's details and its content in one request.
      const boundary = `asap-${crypto.randomUUID()}`;
      const metadata = { name: FILE_NAME, mimeType: 'application/json', parents: [await folderId()] };
      const body =
        `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
        `--${boundary}\r\nContent-Type: application/json\r\n\r\n${json}\r\n--${boundary}--`;
      const response = await call(`${UPLOAD}/files?uploadType=multipart&fields=${FIELDS}`, {
        method: 'POST',
        headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
        body,
      });
      const file = await response.json();
      return { id: file.id, version: file.version };
    },

    async update(id, json) {
      const response = await call(`${UPLOAD}/files/${id}?uploadType=media&fields=${FIELDS}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: json,
      });
      const file = await response.json();
      return { id: file.id, version: file.version };
    },
  };
}
