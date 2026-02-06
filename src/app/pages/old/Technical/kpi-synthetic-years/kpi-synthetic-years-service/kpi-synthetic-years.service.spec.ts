import { TestBed } from '@angular/core/testing';

import { KpiSyntheticYearsService } from './kpi-synthetic-years.service';

describe('KpiSyntheticYearsService', () => {
  let service: KpiSyntheticYearsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KpiSyntheticYearsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
