import { TestBed } from '@angular/core/testing';

import { EmployeeErrorService } from './employee-error.service';

describe('EmployeeErrorService', () => {
  let service: EmployeeErrorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EmployeeErrorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
