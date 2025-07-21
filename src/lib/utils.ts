
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import Dexie, { type Table } from 'dexie';
import type { Recording } from './types';


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

class RecordingsDB extends Dexie {
    recordings!: Table<Recording>;

    constructor() {
        super('ScreenSnappDB');
        this.version(1).stores({
            recordings: '++id, userId, blob, filename, timestamp',
        });
    }
}

export const db = new RecordingsDB();


/**
 * Saves a file by triggering a browser download.
 * @param filename - The name of the file to save.
 * @param data - The Blob data to save.
 */
export async function saveFile(filename: string, data: Blob) {
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
