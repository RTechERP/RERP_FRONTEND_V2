import { TestBed } from '@angular/core/testing';

import { DailyReportSaleService } from './daily-report-sale.service';

describe('DailyReportSaleService', () => {
  let service: DailyReportSaleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DailyReportSaleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
