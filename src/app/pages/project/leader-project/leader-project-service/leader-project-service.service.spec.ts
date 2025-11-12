import { TestBed } from '@angular/core/testing';

import { LeaderProjectServiceService } from '../../leader-project-service.service';

describe('LeaderProjectServiceService', () => {
  let service: LeaderProjectServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LeaderProjectServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
