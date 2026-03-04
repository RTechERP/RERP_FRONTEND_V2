import { TestBed } from '@angular/core/testing';

import { SummaryKpiEmployeePointService } from './summary-kpi-employee-point.service';

describe('SummaryKpiEmployeePointService', () => {
  let service: SummaryKpiEmployeePointService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SummaryKpiEmployeePointService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
