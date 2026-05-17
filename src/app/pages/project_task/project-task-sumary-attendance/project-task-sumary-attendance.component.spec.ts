import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectTaskSumaryAttendanceComponent } from './project-task-sumary-attendance.component';

describe('ProjectTaskSumaryAttendanceComponent', () => {
  let component: ProjectTaskSumaryAttendanceComponent;
  let fixture: ComponentFixture<ProjectTaskSumaryAttendanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectTaskSumaryAttendanceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectTaskSumaryAttendanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
