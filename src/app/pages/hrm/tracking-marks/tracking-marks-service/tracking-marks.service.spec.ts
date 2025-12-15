import { TestBed } from '@angular/core/testing';

import { TrackingMarksService } from './tracking-marks.service';

describe('TrackingMarksService', () => {
  let service: TrackingMarksService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrackingMarksService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
