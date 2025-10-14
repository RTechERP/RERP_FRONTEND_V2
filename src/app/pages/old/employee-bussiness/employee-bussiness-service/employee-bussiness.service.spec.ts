/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { EmployeeBussinessService } from './employee-bussiness.service';

describe('Service: EmployeeBussiness', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EmployeeBussinessService]
    });
  });

  it('should ...', inject([EmployeeBussinessService], (service: EmployeeBussinessService) => {
    expect(service).toBeTruthy();
  }));
});
