import { TestBed } from '@angular/core/testing';

import { DailyReportSaleAdminService } from './daily-report-sale-admin.service';

describe('DailyReportSaleAdminService', () => {
  let service: DailyReportSaleAdminService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DailyReportSaleAdminService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
