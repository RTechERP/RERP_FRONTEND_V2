import { TestBed } from '@angular/core/testing';

import { DailyReportMarService } from './daily-report-mar.service';

describe('DailyReportMarService', () => {
  let service: DailyReportMarService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DailyReportMarService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
