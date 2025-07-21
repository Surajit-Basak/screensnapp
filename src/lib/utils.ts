import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { getDirHandle } from "@/hooks/use-directory-picker";
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
 * Saves a file to the user's chosen directory or falls back to standard download.
 * @param filename - The name of the file to save.
 * @param data - The Blob data to save.
 */
export async function saveFile(filename: string, data: Blob) {
    const dirHandle = getDirHandle();
    
    if (dirHandle) {
        try {
            // Check for permission first, and request it if it's not granted.
            const permission = await dirHandle.queryPermission({ mode: 'readwrite' });
            if (permission !== 'granted') {
                const newPermission = await dirHandle.requestPermission({ mode: 'readwrite' });
                if (newPermission !== 'granted') {
                    throw new Error('Permission to write to this directory was denied.');
                }
            }
            
            const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(data);
            await writable.close();
            return; // Exit function after successful save
        } catch (error) {
            console.error("Could not save to chosen directory, falling back to download.", error);
            // If any error occurs with the directory handle (e.g., permission denied),
            // fall back to the download method.
        }
    }

    // Fallback for browsers that don't support the API, if no directory is chosen,
    // or if saving to the chosen directory fails.
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
