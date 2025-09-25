import { TestBed } from '@angular/core/testing';

import { PlanWeekService } from './plan-week.service';

describe('PlanWeekService', () => {
  let service: PlanWeekService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlanWeekService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
