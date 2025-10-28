import { TestBed } from '@angular/core/testing';

import { IssueSolutionService } from './issue-solution.service';

describe('IssueSolutionService', () => {
  let service: IssueSolutionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IssueSolutionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
