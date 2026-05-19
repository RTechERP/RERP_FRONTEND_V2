import { TestBed } from '@angular/core/testing';

import { ProjectApplicationTypesService } from './project-application-types.service';

describe('ProjectApplicationTypesService', () => {
  let service: ProjectApplicationTypesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProjectApplicationTypesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
