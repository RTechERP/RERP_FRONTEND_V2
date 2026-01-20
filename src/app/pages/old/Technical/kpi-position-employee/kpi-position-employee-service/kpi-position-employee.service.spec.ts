import { TestBed } from '@angular/core/testing';

import { KpiPositionEmployeeService } from './kpi-position-employee.service';

describe('KpiPositionEmployeeService', () => {
  let service: KpiPositionEmployeeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KpiPositionEmployeeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
