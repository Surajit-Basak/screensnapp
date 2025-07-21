
'use client';

import { useState, useEffect } from 'react';
import { RecordingControls } from '@/components/recording-controls';
import { RecordingsList } from '@/components/recordings-list';
import type { Recording } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/utils';
import { useLiveQuery } from 'dexie-react-hooks';


export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // Use live query to automatically update when db changes
  const recordings = useLiveQuery(
    () => user ? db.recordings.where('userId').equals(user.id).reverse().toArray() : [],
    [user]
  );

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);


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
    
    // Dexie handles the addition and the live query will update the UI
    await db.recordings.add(newRecording as Recording);
  };

  const deleteRecording = async (id: number) => {
    await db.recordings.delete(id);
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
        />
        <RecordingsList
            recordings={recordings || []}
            onDelete={deleteRecording}
            isLoading={recordings === undefined}
        />
    </div>
  );
}
