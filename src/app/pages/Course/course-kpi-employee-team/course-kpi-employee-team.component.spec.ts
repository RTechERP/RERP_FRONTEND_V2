import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseKpiEmployeeTeamComponent } from './course-kpi-employee-team.component';

describe('CourseKpiEmployeeTeamComponent', () => {
  let component: CourseKpiEmployeeTeamComponent;
  let fixture: ComponentFixture<CourseKpiEmployeeTeamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseKpiEmployeeTeamComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseKpiEmployeeTeamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
