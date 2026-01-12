import { TestBed } from '@angular/core/testing';

import { KpiErrorEmployeeSummaryMaxService } from './kpi-error-employee-summary-max.service';

describe('KpiErrorEmployeeSummaryMaxService', () => {
  let service: KpiErrorEmployeeSummaryMaxService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KpiErrorEmployeeSummaryMaxService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
