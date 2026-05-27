import { TestBed } from '@angular/core/testing';

import { KPIAGVEvaluationFactorScoringDetailsService } from './kpievaluation-factor-scoring-details.service';

describe('KPIAGVEvaluationFactorScoringDetailsService', () => {
  let service: KPIAGVEvaluationFactorScoringDetailsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KPIAGVEvaluationFactorScoringDetailsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

