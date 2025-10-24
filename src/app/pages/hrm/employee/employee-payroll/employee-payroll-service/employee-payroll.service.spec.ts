/* tslint:disable:no-unused-variable */

import { TestBed, inject } from '@angular/core/testing';
import { EmployeePayrollService } from './employee-payroll.service';

describe('Service: Employee', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EmployeePayrollService]
    });
  });

  it('should ...', inject([EmployeePayrollService], (service: EmployeePayrollService) => {
    expect(service).toBeTruthy();
  }));
});
