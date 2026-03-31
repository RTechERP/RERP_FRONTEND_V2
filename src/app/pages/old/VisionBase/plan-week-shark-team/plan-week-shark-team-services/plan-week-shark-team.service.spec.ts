import { TestBed } from '@angular/core/testing';

import { PlanWeekSharkTeamService } from './plan-week-shark-team.service';

describe('PlanWeekSharkTeamService', () => {
  let service: PlanWeekSharkTeamService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlanWeekSharkTeamService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
