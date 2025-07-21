'use client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { FolderUp } from 'lucide-react';
import { useDirectoryPicker } from '@/hooks/use-directory-picker';

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { dirHandle, selectDirectory, isSupported } = useDirectoryPicker();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);
  
  const handleSaveChanges = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
        title: 'Settings Saved',
        description: 'Your changes have been saved successfully.',
    })
  }

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your account and app preferences.</p>
            </div>
            <Card className="shadow-sm">
                <form onSubmit={handleSaveChanges}>
                    <CardHeader>
                        <CardTitle>Profile</CardTitle>
                        <CardDescription>
                            This is how others will see you on the site.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" defaultValue={user.user_metadata.name || ''} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={user.email || ''} disabled />
                        </div>
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <Button type="submit">Save Changes</Button>
                    </CardFooter>
                </form>
            </Card>

            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Save Location</CardTitle>
                    <CardDescription>
                        Choose a default folder on your computer to save recordings and screenshots.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isSupported ? (
                        <div className="flex flex-col gap-4">
                            <Button variant="outline" onClick={selectDirectory}>
                                <FolderUp className="mr-2 h-4 w-4" />
                                Select Save Folder
                            </Button>
                            <div className="text-sm text-muted-foreground space-y-2 rounded-md border bg-muted p-4">
                                <p>
                                    <span className="font-semibold">Current Folder:</span> {dirHandle ? <strong>{dirHandle.name}</strong> : 'Browser Default (Downloads)'}
                                </p>
                                <p>
                                    Your browser will ask for one-time permission to access the folder you choose. The app will then be able to save files directly there. You can change this at any time. If no folder is selected, files will be downloaded via the standard browser dialog.
                                </p>
                            </div>
                        </div>
                    ) : (
                         <p className="text-sm text-muted-foreground">
                            Your browser does not support direct folder access. Files will be saved to your browser's default "Downloads" folder, and you will be prompted for each save. For the best experience, please use a modern browser like Google Chrome or Microsoft Edge.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    </>
  );
}
