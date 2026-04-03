import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseExamComponent } from './course-exam.component';

describe('CourseExamComponent', () => {
  let component: CourseExamComponent;
  let fixture: ComponentFixture<CourseExamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseExamComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseExamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
