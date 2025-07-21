'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { RecordingControls } from '@/components/recording-controls';
import { RecordingsList } from '@/components/recordings-list';
import type { Recording } from '@/lib/types';

export default function Home() {
  const [recordings, setRecordings] = useState<Recording[]>([]);

  const addRecording = (blob: Blob, type: 'video' | 'screenshot') => {
    const id = crypto.randomUUID();
    const timestamp = new Date();
    const extension = type === 'video' ? 'webm' : 'png';
    const filename = `ScreenSnapp-${timestamp.toISOString()}.${extension}`;
    const url = URL.createObjectURL(blob);

    const newRecording: Recording = {
      id,
      type,
      blob,
      url,
      filename,
      timestamp,
      tags: [],
      description: '',
    };
    setRecordings((prev) => [newRecording, ...prev]);
  };

  const deleteRecording = (id: string) => {
    setRecordings((prev) =>
      prev.filter((rec) => {
        if (rec.id === id) {
          URL.revokeObjectURL(rec.url);
          return false;
        }
        return true;
      })
    );
  };

  const updateRecording = (id: string, updates: Partial<Recording>) => {
    setRecordings((prev) =>
      prev.map((rec) => (rec.id === id ? { ...rec, ...updates } : rec))
    );
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex-1">
        <RecordingControls
          onRecordingComplete={(blob) => addRecording(blob, 'video')}
          onScreenshot={(blob) => addRecording(blob, 'screenshot')}
        />
        <RecordingsList
          recordings={recordings}
          onDelete={deleteRecording}
          onUpdate={updateRecording}
        />
      </main>
    </div>
  );
}
