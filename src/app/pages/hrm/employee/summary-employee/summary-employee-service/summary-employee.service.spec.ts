import { TestBed } from '@angular/core/testing';

import { SummaryEmployeeService } from './summary-employee.service';

describe('SummaryEmployeeService', () => {
  let service: SummaryEmployeeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SummaryEmployeeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
