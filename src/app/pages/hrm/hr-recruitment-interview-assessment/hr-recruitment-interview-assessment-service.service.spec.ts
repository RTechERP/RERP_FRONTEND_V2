import { TestBed } from '@angular/core/testing';

import { HrRecruitmentInterviewAssessmentServiceService } from './hr-recruitment-interview-assessment-service.service';

describe('HrRecruitmentInterviewAssessmentServiceService', () => {
  let service: HrRecruitmentInterviewAssessmentServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HrRecruitmentInterviewAssessmentServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
