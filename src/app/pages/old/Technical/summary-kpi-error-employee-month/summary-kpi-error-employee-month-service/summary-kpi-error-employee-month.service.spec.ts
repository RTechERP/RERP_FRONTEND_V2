import { TestBed } from '@angular/core/testing';

import { SummaryKpiErrorEmployeeMonthService } from './summary-kpi-error-employee-month.service';

describe('SummaryKpiErrorEmployeeMonthService', () => {
  let service: SummaryKpiErrorEmployeeMonthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SummaryKpiErrorEmployeeMonthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
