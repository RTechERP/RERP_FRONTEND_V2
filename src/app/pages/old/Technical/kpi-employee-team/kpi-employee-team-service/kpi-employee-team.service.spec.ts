import { TestBed } from '@angular/core/testing';

import { KpiEmployeeTeamService } from './kpi-employee-team.service';

describe('KpiEmployeeTeamService', () => {
  let service: KpiEmployeeTeamService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KpiEmployeeTeamService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
