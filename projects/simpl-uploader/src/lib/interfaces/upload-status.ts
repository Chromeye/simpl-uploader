import { Observable } from 'rxjs';

export interface UploadStatus {
    fileName: string;
    fileSize: number;
    progress: Observable<number> | null;
    errors?: string[];
}