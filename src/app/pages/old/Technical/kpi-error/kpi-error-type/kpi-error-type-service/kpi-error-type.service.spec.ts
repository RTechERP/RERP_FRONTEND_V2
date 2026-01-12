import { TestBed } from '@angular/core/testing';

import { KpiErrorTypeService } from './kpi-error-type.service';

describe('KpiErrorTypeService', () => {
  let service: KpiErrorTypeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KpiErrorTypeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
