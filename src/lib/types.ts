export type Recording = {
  id: number;
  userId: string;
  type: 'video';
  blob: Blob;
  filename: string;
  timestamp: Date;
  tags: string[];
  description: string;
};
