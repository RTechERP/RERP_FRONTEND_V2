import { TestBed } from '@angular/core/testing';

import { ProjectWorkerService } from './project-worker.service';

describe('ProjectWorkerService', () => {
  let service: ProjectWorkerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProjectWorkerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
