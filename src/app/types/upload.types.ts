// Upload status types
export type UploadStatus =
  | 'idle'
  | 'uploading'
  | 'processing'
  | 'success'
  | 'error';

export interface UploadState {
  status: UploadStatus;
  progress?: number;
  message?: string;
  result?: any;
}
