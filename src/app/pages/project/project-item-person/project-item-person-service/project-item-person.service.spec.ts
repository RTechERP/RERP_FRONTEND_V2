import { TestBed } from '@angular/core/testing';

import { ProjectItemPersonService } from './project-item-person.service';

describe('ProjectItemPersonService', () => {
  let service: ProjectItemPersonService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProjectItemPersonService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
