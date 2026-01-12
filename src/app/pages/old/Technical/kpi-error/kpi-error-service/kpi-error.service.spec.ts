import { TestBed } from '@angular/core/testing';

import { KpiErrorService } from './kpi-error.service';

describe('KpiErrorService', () => {
  let service: KpiErrorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KpiErrorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
