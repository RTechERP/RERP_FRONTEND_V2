import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseKpiEmployeeTeamDetailComponent } from './course-kpi-employee-team-detail.component';

describe('CourseKpiEmployeeTeamDetailComponent', () => {
  let component: CourseKpiEmployeeTeamDetailComponent;
  let fixture: ComponentFixture<CourseKpiEmployeeTeamDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseKpiEmployeeTeamDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseKpiEmployeeTeamDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
