import { TestBed } from '@angular/core/testing';

import { KpiCriteriaService } from './kpi-criteria.service';

describe('KpiCriteriaService', () => {
  let service: KpiCriteriaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KpiCriteriaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
