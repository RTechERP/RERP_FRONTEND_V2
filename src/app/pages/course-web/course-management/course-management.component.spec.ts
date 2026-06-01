import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseWebManagementComponent } from './course-management.component';

describe('CourseWebManagementComponent', () => {
  let component: CourseWebManagementComponent;
  let fixture: ComponentFixture<CourseWebManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseWebManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseWebManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
