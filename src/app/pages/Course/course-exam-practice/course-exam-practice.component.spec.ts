import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseExamPracticeComponent } from './course-exam-practice.component';

describe('CourseExamPracticeComponent', () => {
  let component: CourseExamPracticeComponent;
  let fixture: ComponentFixture<CourseExamPracticeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseExamPracticeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseExamPracticeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
