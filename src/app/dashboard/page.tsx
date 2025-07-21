'use client';

import { useState } from 'react';
import { RecordingControls } from '@/components/recording-controls';
import { RecordingsList } from '@/components/recordings-list';
import type { Recording } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { saveFile } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const { toast } = useToast();

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

  const handleScreenshotAndSave = async (blob: Blob) => {
    const timestamp = new Date();
    const filename = `ScreenSnapp-Screenshot-${timestamp.toISOString()}.png`;
    try {
      await saveFile(filename, blob);
       toast({
        title: 'Screenshot Saved',
        description: `Your screenshot has been saved as ${filename}.`,
      });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
         toast({
          title: 'Error Saving Screenshot',
          description: 'Could not save the file. Please try again.',
          variant: 'destructive',
        });
      }
    }
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
    <div className="space-y-8">
        <RecordingControls
            onRecordingComplete={(blob) => addRecording(blob, 'video')}
            onScreenshot={handleScreenshotAndSave}
        />
        <RecordingsList
            recordings={recordings}
            onDelete={deleteRecording}
            onUpdate={updateRecording}
        />
    </div>
  );
}
