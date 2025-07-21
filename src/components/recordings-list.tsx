
'use client';

import type { Recording } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Monitor, Trash2, Save } from 'lucide-react';
import { saveFile } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';

type RecordingsListProps = {
  recordings: Recording[];
  onDelete: (id: number) => void;
  isLoading: boolean;
};

function RecordingCard({ recording, onDelete }: { recording: Recording; onDelete: (id: number) => void; }) {
  const { toast } = useToast();
  const objectUrl = URL.createObjectURL(recording.blob);

  const handleSave = async () => {
    try {
        await saveFile(recording.filename, recording.blob);
        toast({
            title: "File Saved",
            description: `${recording.filename} has been saved.`,
        });
    } catch (error) {
        if ((error as Error).name !== 'AbortError') {
             toast({
                title: 'Error Saving File',
                description: 'Could not save the file. Please try again.',
                variant: 'destructive',
            });
        }
    }
  };

  return (
    <Card className="overflow-hidden shadow-md transition-all hover:shadow-xl">
      <CardContent className="p-0">
        <video src={objectUrl} controls className="aspect-video w-full bg-muted" />
      </CardContent>
      <CardHeader className="p-4">
        <CardTitle className="flex items-center gap-2 text-base font-medium truncate">
          <Monitor className="h-5 w-5 shrink-0 text-primary" />
          <span className="truncate">{recording.filename}</span>
        </CardTitle>
        <div className="text-xs text-muted-foreground">
          {new Date(recording.timestamp).toLocaleString()}
        </div>
      </CardHeader>
      <CardFooter className="bg-muted/50 p-4 flex flex-col sm:flex-row gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" /> Save
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(recording.id)}>
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </Button>
      </CardFooter>
    </Card>
  );
}

export function RecordingsList({ recordings, onDelete, isLoading }: RecordingsListProps) {
  if (isLoading) {
    return (
        <div>
            <div className="pb-4 border-b mb-6">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-1/2 mt-2" />
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-0">
                            <Skeleton className="aspect-video w-full" />
                        </CardContent>
                        <CardHeader className="p-4">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-1/2 mt-2" />
                        </CardHeader>
                        <CardFooter className="bg-muted/50 p-4 flex justify-end gap-2">
                            <Skeleton className="h-9 w-20" />
                            <Skeleton className="h-9 w-24" />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
  }

  if (recordings.length === 0) {
    return (
       <Card className="shadow-lg rounded-xl">
        <CardContent className="p-6 md:p-8">
            <div className="text-center py-16 px-6 border-2 border-dashed rounded-xl">
                <Monitor className="mx-auto h-16 w-16 text-muted-foreground" />
                <h2 className="mt-6 text-2xl font-semibold tracking-tight">No Recordings Yet</h2>
                <p className="mt-2 text-muted-foreground">
                    Use the controls above to start a new screen recording.
                </p>
            </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
       <div className="pb-4 border-b mb-6">
            <h2 className="text-3xl font-bold tracking-tight">Your Recordings</h2>
            <p className="text-muted-foreground">Here are your recent recordings, saved in your browser.</p>
        </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {recordings.map((rec) => (
          <RecordingCard key={rec.id} recording={rec} onDelete={onDelete} />
        ))}
      </div>
    </div>
  );
}
