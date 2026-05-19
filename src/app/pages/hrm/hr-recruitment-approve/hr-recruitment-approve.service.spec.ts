import { TestBed } from '@angular/core/testing';

import { HrRecruitmentApproveService } from './hr-recruitment-approve.service';

describe('HrRecruitmentApproveService', () => {
  let service: HrRecruitmentApproveService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HrRecruitmentApproveService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
