import { TestBed } from '@angular/core/testing';

import { ProjectJoinSummaryService } from './project-join-summary.service';

describe('ProjectJoinSummaryService', () => {
  let service: ProjectJoinSummaryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProjectJoinSummaryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
