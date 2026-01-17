import { TestBed } from '@angular/core/testing';

import { SummaryKpiErrorEmployeeService } from './summary-kpi-error-employee.service';

describe('SummaryKpiErrorEmployeeService', () => {
  let service: SummaryKpiErrorEmployeeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SummaryKpiErrorEmployeeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
