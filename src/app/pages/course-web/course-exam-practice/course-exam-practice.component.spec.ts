import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseExamPracticeWebComponent } from './course-exam-practice.component';

describe('CourseExamPracticeWebComponent', () => {
  let component: CourseExamPracticeWebComponent;
  let fixture: ComponentFixture<CourseExamPracticeWebComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseExamPracticeWebComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseExamPracticeWebComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
