import { TestBed } from '@angular/core/testing';

import { ProjectPartListService } from './project-part-list-service.service';

describe('ProjectPartListService', () => {
  let service: ProjectPartListService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProjectPartListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
