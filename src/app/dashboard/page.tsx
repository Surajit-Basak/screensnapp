
'use client';

import { useState, useEffect } from 'react';
import { RecordingControls } from '@/components/recording-controls';
import { RecordingsList } from '@/components/recordings-list';
import type { Recording } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/utils';


export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [dbLoading, setDbLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function loadRecordings() {
        if (user) {
            setDbLoading(true);
            const userRecordings = await db.recordings.where('userId').equals(user.id).reverse().toArray();
            setRecordings(userRecordings);
            setDbLoading(false);
        }
    }
    loadRecordings();
  }, [user]);


  const addRecording = async (blob: Blob, type: 'video' | 'screenshot') => {
    if (!user) return;
    const timestamp = new Date();
    const extension = type === 'video' ? 'webm' : 'png';
    const filename = `ScreenSnapp-${timestamp.toISOString()}.${extension}`;

    const newRecording: Omit<Recording, 'id'> = {
      userId: user.id,
      type,
      blob,
      filename,
      timestamp,
      tags: [],
      description: '',
    };

    const id = await db.recordings.add(newRecording as Recording);
    const completeRecording = { ...newRecording, id } as Recording;
    setRecordings((prev) => [completeRecording, ...prev]);
  };

  const deleteRecording = async (id: number) => {
    await db.recordings.delete(id);
    setRecordings((prev) => prev.filter((rec) => rec.id !== id));
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
    <div className="space-y-8">
        <RecordingControls
            onRecordingComplete={(blob) => addRecording(blob, 'video')}
            onScreenshotComplete={(blob) => addRecording(blob, 'screenshot')}
        />
        <RecordingsList
            recordings={recordings}
            onDelete={deleteRecording}
            isLoading={dbLoading}
        />
    </div>
  );
}
