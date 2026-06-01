import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseExamWebComponent } from './course-exam.component';

describe('CourseExamComponent', () => {
  let component: CourseExamWebComponent;
  let fixture: ComponentFixture<CourseExamWebComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseExamWebComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseExamWebComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
