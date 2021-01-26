import { Component } from '@angular/core';
import { UploadStatus, UploadValidator } from '@streameye/simpl-uploader';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'test-app';
  allFiles!: Observable<UploadStatus[]>;
  totalProgress!: Observable<number>;
  isUploading = false;
  validators: UploadValidator[] = [
    {
      valFn: (file: File) => file.name.indexOf('AdobeStock') > -1,
      error: 'File must be from Adobe Stock'
    }
  ]
  getTotalProgressFormatted(progress: number | null) {
    return progress && progress > 0 ? progress : 0
  }
}
