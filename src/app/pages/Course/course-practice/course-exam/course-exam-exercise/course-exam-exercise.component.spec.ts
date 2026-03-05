import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseExamExerciseComponent } from './course-exam-exercise.component';

describe('CourseExamExerciseComponent', () => {
  let component: CourseExamExerciseComponent;
  let fixture: ComponentFixture<CourseExamExerciseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseExamExerciseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseExamExerciseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
