import { TestBed } from '@angular/core/testing';

import { KPIEvaluationFactorScoringDetailsService } from './kpievaluation-factor-scoring-details.service';

describe('KPIEvaluationFactorScoringDetailsService', () => {
  let service: KPIEvaluationFactorScoringDetailsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KPIEvaluationFactorScoringDetailsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
