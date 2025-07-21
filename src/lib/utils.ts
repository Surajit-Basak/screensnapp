import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { getDirHandle } from "@/hooks/use-directory-picker";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Saves a file to the user's chosen directory or falls back to standard download.
 * @param filename - The name of the file to save.
 * @param data - The Blob data to save.
 */
export async function saveFile(filename: string, data: Blob) {
    const dirHandle = getDirHandle();
    
    if (dirHandle) {
        try {
            // Check for permission first
            if ((await dirHandle.queryPermission({ mode: 'readwrite' })) !== 'granted') {
                // Request permission if not granted
                if ((await dirHandle.requestPermission({ mode: 'readwrite' })) !== 'granted') {
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
            // If any error occurs with the directory handle, fall back to the download method.
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
