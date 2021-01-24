import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimplUploaderComponent } from './simpl-uploader.component';

describe('SimplUploaderComponent', () => {
  let component: SimplUploaderComponent;
  let fixture: ComponentFixture<SimplUploaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SimplUploaderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SimplUploaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
