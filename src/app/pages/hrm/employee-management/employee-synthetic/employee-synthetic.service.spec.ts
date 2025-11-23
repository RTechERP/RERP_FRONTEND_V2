import { TestBed } from '@angular/core/testing';

import { EmployeeSyntheticService } from './employee-synthetic.service';

describe('EmployeeSyntheticService', () => {
  let service: EmployeeSyntheticService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EmployeeSyntheticService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
