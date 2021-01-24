import { TestBed } from '@angular/core/testing';

import { SimplUploaderService } from './simpl-uploader.service';

describe('SimplUploaderService', () => {
  let service: SimplUploaderService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SimplUploaderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
