'use client';
import { useState, useEffect } from 'react';

// This is a simplified store for the directory handle.
// In a real-world app, you might use IndexedDB for more robust persistence.
let dirHandle: FileSystemDirectoryHandle | null = null;

const setDirHandle = (handle: FileSystemDirectoryHandle | null) => {
    dirHandle = handle;
    window.dispatchEvent(new Event('directory-handle-change'));
};

export const getDirHandle = () => dirHandle;

export function useDirectoryPicker() {
    const [handle, setHandle] = useState<FileSystemDirectoryHandle | null>(dirHandle);
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        setIsSupported('showDirectoryPicker' in window);

        const handleStorageChange = () => {
            setHandle(getDirHandle());
        };

        window.addEventListener('directory-handle-change', handleStorageChange);
        return () => {
            window.removeEventListener('directory-handle-change', handleStorageChange);
        };
    }, []);

    const selectDirectory = async () => {
        if (!isSupported) return;
        try {
            const handle = await window.showDirectoryPicker();
            setDirHandle(handle);
        } catch (error) {
            if ((error as Error).name !== 'AbortError') {
                console.error('Error selecting directory:', error);
            }
        }
    };

    return { dirHandle: handle, selectDirectory, isSupported };
}
