import { TestBed } from '@angular/core/testing';

import { CourseKpiEmployeeTeamService } from './course-kpi-employee-team.service';

describe('CourseKpiEmployeeTeamService', () => {
  let service: CourseKpiEmployeeTeamService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CourseKpiEmployeeTeamService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
