import { TestBed } from '@angular/core/testing';

import { DailyReportTechService } from './daily-report-tech.service';

describe('DailyReportTechService', () => {
  let service: DailyReportTechService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DailyReportTechService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
