export interface UploadValidator {
    valFn: (file: File) => boolean;
    error: string;
  }