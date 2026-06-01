import { TestBed } from '@angular/core/testing';

import { CourseExamService } from './course-exam.service';

describe('CourseExamService', () => {
  let service: CourseExamService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CourseExamService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
