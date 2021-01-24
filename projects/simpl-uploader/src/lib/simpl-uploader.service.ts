import { HttpClient, HttpEvent, HttpEventType, HttpProgressEvent, HttpRequest, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { UploadValidator } from './interfaces/upload-validator';
import { UploadStatus } from './interfaces/upload-status';

const url = 'http://localhost:9999/upload'; // endpoint to upload backend. need to add auth

@Injectable()
export class SimplUploaderService {

  constructor(private http: HttpClient) { }

  public upload(files: Set<File>, validators: UploadValidator[]): UploadStatus[] {
    const status: UploadStatus[] = [];

    files.forEach(file => {
      const errors = validators.filter(val => !val.valFn(file)).map(valWithError => valWithError.error);
      if (!errors.length) {
        const formData: FormData = new FormData();
        formData.append('file', file, file.name);
        // create a http-post request and pass the form
        // tell it to report the upload progress
        const req = new HttpRequest('POST', url, formData, {
          reportProgress: true
        });
        // create a new progress-subject for every file
        const progress = new Subject<number>();
        this.http.request(req).subscribe(event => {
          if (event && event.type === HttpEventType.UploadProgress) {
            if (event.total) {
              const percentDone = Math.round(100 * event.loaded / event.total);
              progress.next(percentDone)
            }
          } else if (event instanceof HttpResponse) {
            progress.complete()
          }
        });
        // push file with progress stream
        status.push({ fileName: file.name, fileSize: file.size, progress: progress.asObservable() })
      } else {
        // push file with null progress and errors
        status.push({ fileName: file.name, fileSize: file.size, progress: null, errors })
      }

    });
    return status;
  }
}
