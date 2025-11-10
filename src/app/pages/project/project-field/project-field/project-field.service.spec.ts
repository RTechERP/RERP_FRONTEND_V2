import { TestBed } from '@angular/core/testing';

import { ProjectFieldService } from './project-field-service/project-field.service';

describe('ProjectFieldService', () => {
  let service: ProjectFieldService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProjectFieldService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
