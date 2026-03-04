import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseExamPracticeDetailComponent } from './course-exam-practice-detail.component';

describe('CourseExamPracticeDetailComponent', () => {
  let component: CourseExamPracticeDetailComponent;
  let fixture: ComponentFixture<CourseExamPracticeDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseExamPracticeDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseExamPracticeDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
