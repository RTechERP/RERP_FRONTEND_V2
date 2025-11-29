import { TestBed } from '@angular/core/testing';

import { EmployeeSaleManagerService } from './employee-sale-manager.service';

describe('EmployeeSaleManagerService', () => {
  let service: EmployeeSaleManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EmployeeSaleManagerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
