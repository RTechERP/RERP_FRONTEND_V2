import { TestBed } from '@angular/core/testing';

import { DailyReportHrService } from './daily-report-hr.service';

describe('DailyReportHrService', () => {
  let service: DailyReportHrService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DailyReportHrService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
