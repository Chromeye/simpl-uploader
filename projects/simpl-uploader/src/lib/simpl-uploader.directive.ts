import { Directive, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output } from '@angular/core';

import { combineLatest, Observable, of, Subject } from 'rxjs';
import { UploadStatus } from './interfaces/upload-status';
import { FinishedUpload } from './interfaces/finished-upload';
import { TrafficCounter } from './interfaces/traffic-counter';
import { UploadValidator } from './interfaces/upload-validator';
import { SimplUploaderService } from './simpl-uploader.service';


import {
  scan, startWith, tap, switchMap, filter, mergeMap, map, take,
  takeUntil, shareReplay, distinctUntilChanged, pairwise, delay
} from 'rxjs/operators';

// cannot handle click/ drop events in struct directive due to syntactic sugar that implements a template
// export interface UploaderContext {
//   addedFiles: Observable<UploadStatus[]>;
//   progressPerc: Observable<number>

// }

@Directive({
  selector: '[streameyeSimplUploader]',
  providers: [SimplUploaderService]
})
export class SimplUploaderDirective implements OnInit, OnDestroy {

  // expose two streams - one to show the files - each with its progress, the second to show total progress
  @Output() files: EventEmitter<Observable<UploadStatus[]>> = new EventEmitter();
  @Output() completeProgress: EventEmitter<Observable<number>> = new EventEmitter();
  // get an array of validators
  @Input() validators: UploadValidator[] = [];

  private _disabled = false;

  // employ a subject to handle the dropped files in the container
  private addedFiles: Subject<UploadStatus[]> = new Subject();
  private finishedUpload!: Observable<FinishedUpload>
  private totalWeight!: Observable<TrafficCounter>;
  private finishedWeight!: Observable<TrafficCounter>;

  // handle the drop
  @HostListener('drop', ['$event']) onDrop(event: DragEvent) {
    console.log('drop');
    if (this._disabled || !event.dataTransfer) {
      return;
    }
    this.preventDefault(event);
    this.handleFileDrop(event.dataTransfer.files);
  }
  // required to enable the drop handling
  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent) {
    if (this._disabled) {
      return;
    }
    this.preventDefault(event);
  }
  @HostListener('click', ['$event']) captureClick(event: MouseEvent) {
    // extend to user file input if needed, wiring the click to click of the file input
  }

  // the service that takes care of validation and obtaining file progress streams from the backend
  constructor(
    private simplUploaderService: SimplUploaderService) { }

  ngOnInit() {
    const progress = this.getProgressStream();
    this.files.emit(this.addedFiles$);
    this.completeProgress.emit(progress);
  }
  ngOnDestroy() {

  }
  // When new files are added concatenate them to the current in progress and emit
  // the new array as event in the files stream
  get addedFiles$(): Observable<UploadStatus[]> {
    return this.addedFiles.asObservable().pipe(
      scan((all, current) => all.concat(current))
    );
  }
  // handle the file drop. user the service to invoke the backend and get
  // an array of file objects back. Each file has progress property which is observable stream
  private handleFileDrop(files: FileList) {
    const uploads = this.simplUploaderService.upload(
      new Set(Array.from(files)), this.validators
    );
    this.addedFiles.next(uploads);
  }
  // logic for the total progress calculation
  private getProgressStream(): Observable<number> {
    // IMPORTANT - this will become evident later. We need to set up a replay stream here, so that
    // when the counter observables are dismissed when total progress = 100 and remade on new 
    // drop, this would replay the last drop, or the observable chain of events would not be fired!
    const replay = this.addedFiles.pipe(
      map(added => added),
      shareReplay({ bufferSize: 1, refCount: true }),
    )
    // loaded kb = total kb
    // for all the below we use the replay stream
    // startWith empty array of files
    // IMPORTANT: only start counting when previous state is array length = 0 and next value is > 0. I.e. an initial drop.
    const percProgress = replay.pipe(
      startWith([]),
      pairwise(),
      filter(([prev, current]) => {
        return (prev.length === 0 && current.length > 0)
      }),
      // this is important as what it does is it creates the combine observable stream, which in turn creates the counters.
      switchMap(() => {
        // when count starts, switch to a combined stream of total and finished
        return combine.pipe(
          distinctUntilChanged(),
          // count until all have finished
          // when this is emitted, the combine stream is closed. Because it invokes the count streams, they are closed, too.
          // when they are closed, scans lose their state and counters are cleared :)
          takeUntil(allFinished)
        )
      })
    )
    // count the currenly dropped files total weight
    const countedWeight = replay.pipe(
      // map the array of files to an object with total kb and files
      map(currentlyAdded => {
        // using reduce, niiiiceee. at last some useful use case for reduce :)
        const kb = currentlyAdded.reduce((totalKb, current) => {
          // exclude any file that has errors set
          if (current.errors) {
            return totalKb;
          }
          return totalKb + current.fileSize
        }, 0)
        // exclude any file that has errors set
        const files = currentlyAdded.filter(added => !added.errors).length;
        // return total KB in this batch and number of files
        return { kb, files }
      })
    )
    // count the total weight of all files that have been added so far
    this.totalWeight = countedWeight.pipe(
      // using Scan. Scan is possibly one of the most useful operators in RxJS. You should pay special attention to it
      // it reports status on each iteration unlike RxJS reduce that just reports final value. It also keeps its state 
      // while the stream is active!
      scan((total: TrafficCounter, current: TrafficCounter) => {
        return { kb: total.kb + current.kb, files: total.files + current.files }
      }),
      // start with 0 kb in 0 files :)
      startWith({ kb: 0, files: 0 })
    )
    // there is some cool dark magic below. We need to convert finished upload to a new total state
    this.finishedUpload = replay.pipe(
      mergeMap((uploads: UploadStatus[]) => {
        // so using mergeMap to convert from one source observable to a higher order observable.
        // mergeMap is similar to switchMap with one very important difference - it does not terminate
        // the source stream. It keeps its subscription open while the target is being processed.
        // this is important so that we can process new dropped files on the go. 
        return uploads.map(upload => {
          // map each upload (file) to its progress observable IF progress is available - i.e. no error is reported
          if (upload.progress) {
            return upload.progress.pipe(
              // map the progress stream to an object returning the progress, fileName and fileSize to be reported later
              map(progress => {
                return { progress, fileName: upload.fileName, fileSize: upload.fileSize }
              }),
              // IMPORTANT - only emit this stream IF progress is 100 - i.e. file is uploaded
              filter(upl => upl.progress === 100),
              // this is just as a safety to only take single emission and finalise the stream
              take(1)
            )
          }
          // if progress = null => there are errors, return progress null fileName to report the error and 0 total file size
          return of({ progress: null, fileName: upload.fileName, fileSize: 0 })

        })
      }),
      // mapping an upload to another observable for the progress returns an observable of observables
      // (so called metastream). using mergeMap (previously known as flatMap) flattens the resulting stream
      mergeMap(finished => finished)
    )
    // similarly to counting the total uploading above, we count the total finished - again via scan
    this.finishedWeight = this.finishedUpload.pipe(
      scan((totalFinished: TrafficCounter, finishedUploading: FinishedUpload) => {

        const totalFiles = finishedUploading.progress ? totalFinished.files + 1 : totalFinished.files;
        const totalKb = totalFinished.kb + finishedUploading.fileSize;
        return { kb: totalKb, files: totalFiles }
      }, { kb: 0, files: 0 })
    )
    // AND FINALLY combine the two streams with combineLatest. Important catch here is that this only
    // emits when all streams have emitted. But this is OK, we cannot have finished until we have new upload
    const combine = combineLatest([this.totalWeight, this.finishedWeight]).pipe(

      map(([total, finished]) => {
        // console.log(total, finished); Oh well this is obvious - report the total in % :)
        return (total.kb > 0 ? Math.round(finished.kb / total.kb * 100) : 0)
      }),
      startWith(0)
    )
    // wrapping all up - count the progress, until all have uploaded and clear
    // the below would emit an event IF combined observable emits 100 total
    const allFinished = combine.pipe(
      // the below delay(0) is a trick to emit at the end of the call stack so that the 100 value is reported.
      // else the chain of events is broken before we emit 100% total IF there are uploads, i.e. files with no errors.
      delay(0),
      filter(combined => combined === 100),
      // switch to clearing the addedFiles and emitting just an []. Here it doesnt matter what we emit, we just need an
      // emission so that takeUntil fires and closes the observables.
      switchMap(() => {
        this.addedFiles.next([]);
        return of([])
      })
    )
    // 
    return percProgress;
  }
  private preventDefault(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

}
