import { TestBed } from '@angular/core/testing';

import { KpiErrorEmployeeService } from './kpi-error-employee.service';

describe('KpiErrorEmployeeService', () => {
  let service: KpiErrorEmployeeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KpiErrorEmployeeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
