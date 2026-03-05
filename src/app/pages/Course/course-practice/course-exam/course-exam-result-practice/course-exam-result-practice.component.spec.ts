import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseExamResultPracticeComponent } from './course-exam-result-practice.component';

describe('CourseExamResultPracticeComponent', () => {
  let component: CourseExamResultPracticeComponent;
  let fixture: ComponentFixture<CourseExamResultPracticeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseExamResultPracticeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseExamResultPracticeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
