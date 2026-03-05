import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseExamResultComponent } from './course-exam-result.component';

describe('CourseExamResultComponent', () => {
  let component: CourseExamResultComponent;
  let fixture: ComponentFixture<CourseExamResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseExamResultComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseExamResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
