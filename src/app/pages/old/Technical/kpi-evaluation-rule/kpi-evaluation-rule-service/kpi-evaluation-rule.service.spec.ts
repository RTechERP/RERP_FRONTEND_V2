import { TestBed } from '@angular/core/testing';

import { KpiEvaluationRuleService } from './kpi-evaluation-rule.service';

describe('KpiEvaluationRuleService', () => {
  let service: KpiEvaluationRuleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KpiEvaluationRuleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
