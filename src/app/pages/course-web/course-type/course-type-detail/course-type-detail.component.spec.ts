import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseTypeDetailComponent } from './course-type-detail.component';

describe('CourseTypeDetailComponent', () => {
  let component: CourseTypeDetailComponent;
  let fixture: ComponentFixture<CourseTypeDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseTypeDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseTypeDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
