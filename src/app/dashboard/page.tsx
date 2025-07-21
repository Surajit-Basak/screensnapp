'use client';

import { useState } from 'react';
import { RecordingControls } from '@/components/recording-controls';
import { RecordingsList } from '@/components/recordings-list';
import type { Recording } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Header } from '@/components/header';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [recordings, setRecordings] = useState<Recording[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);


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

  if (loading || !user) {
    return (
        <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
                <p>Loading...</p>
            </div>
        </div>
    )
  }

  return (
    <>
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
    </>
  );
}