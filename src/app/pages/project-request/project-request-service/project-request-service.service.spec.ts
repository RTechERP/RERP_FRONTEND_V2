import { TestBed } from '@angular/core/testing';

import { ProjectRequestServiceService } from './project-request-service.service';

describe('ProjectRequestServiceService', () => {
  let service: ProjectRequestServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProjectRequestServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
