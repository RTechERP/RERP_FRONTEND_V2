import { TestBed } from '@angular/core/testing';

import { KpiEvaluationService } from './kpi-evaluation.service';

describe('KpiEvaluationService', () => {
  let service: KpiEvaluationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KpiEvaluationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
