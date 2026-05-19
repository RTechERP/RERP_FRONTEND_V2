import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectTaskDashboardComponent } from './project-task-dashboard.component';

describe('ProjectTaskDashboardComponent', () => {
  let component: ProjectTaskDashboardComponent;
  let fixture: ComponentFixture<ProjectTaskDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectTaskDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectTaskDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
