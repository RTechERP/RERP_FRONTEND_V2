import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseTypeWebComponent } from './course-type.component';

describe('CourseTypeComponent', () => {
  let component: CourseTypeWebComponent;
  let fixture: ComponentFixture<CourseTypeWebComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseTypeWebComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseTypeWebComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
