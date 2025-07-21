'use client';

import { useState } from 'react';
import { RecordingControls } from '@/components/recording-controls';
import { RecordingsList } from '@/components/recordings-list';
import type { Recording } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Header } from '@/components/header';
import { Card, CardContent } from '@/components/ui/card';

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
      <main className="flex-1 bg-muted/20">
        <div className="container mx-auto max-w-7xl py-8">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
             <div className="lg:col-span-1 sticky top-24">
                <Card className="shadow-lg rounded-xl">
                    <CardContent className="p-6">
                       <RecordingControls
                          onRecordingComplete={(blob) => addRecording(blob, 'video')}
                          onScreenshot={(blob) => addRecording(blob, 'screenshot')}
                        />
                    </CardContent>
                </Card>
             </div>
             <div className="lg:col-span-2">
                 <RecordingsList
                    recordings={recordings}
                    onDelete={deleteRecording}
                    onUpdate={updateRecording}
                  />
             </div>
           </div>
        </div>
      </main>
    </>
  );
}
