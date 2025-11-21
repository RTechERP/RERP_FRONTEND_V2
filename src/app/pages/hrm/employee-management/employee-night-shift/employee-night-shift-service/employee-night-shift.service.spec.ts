import { TestBed } from '@angular/core/testing';

import { EmployeeNightShiftService } from './employee-night-shift.service';

describe('EmployeeNightShiftService', () => {
  let service: EmployeeNightShiftService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EmployeeNightShiftService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
