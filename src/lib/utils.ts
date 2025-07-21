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
    
    // Use the File System Access API if a directory has been selected
    if (dirHandle) {
        const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(data);
        await writable.close();
    } else {
        // Fallback for browsers that don't support the API or if no directory is chosen
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}
