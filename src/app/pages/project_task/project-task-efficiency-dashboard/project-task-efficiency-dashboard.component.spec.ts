import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectTaskEfficiencyDashboardComponent } from './project-task-efficiency-dashboard.component';

describe('ProjectTaskEfficiencyDashboardComponent', () => {
  let component: ProjectTaskEfficiencyDashboardComponent;
  let fixture: ComponentFixture<ProjectTaskEfficiencyDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectTaskEfficiencyDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectTaskEfficiencyDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
