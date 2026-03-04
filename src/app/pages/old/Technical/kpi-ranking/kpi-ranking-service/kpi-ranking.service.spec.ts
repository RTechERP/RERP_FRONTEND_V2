import { TestBed } from '@angular/core/testing';

import { KpiRankingService } from './kpi-ranking.service';

describe('KpiRankingService', () => {
  let service: KpiRankingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KpiRankingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
