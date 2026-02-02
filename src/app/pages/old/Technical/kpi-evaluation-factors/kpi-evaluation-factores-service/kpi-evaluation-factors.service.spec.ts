import { TestBed } from '@angular/core/testing';

import { KpiEvaluationFactorsService } from './kpi-evaluation-factors.service';

describe('KpiEvaluationFactorsService', () => {
  let service: KpiEvaluationFactorsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KpiEvaluationFactorsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
