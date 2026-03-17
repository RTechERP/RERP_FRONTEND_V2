import { TestBed } from '@angular/core/testing';

import { HRRecruitmentExamService } from './hrrecruitment-exam.service';

describe('HRRecruitmentExamService', () => {
  let service: HRRecruitmentExamService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HRRecruitmentExamService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
