import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectTaskStatusChartComponent } from './project-task-status-chart.component';

describe('ProjectTaskStatusChartComponent', () => {
  let component: ProjectTaskStatusChartComponent;
  let fixture: ComponentFixture<ProjectTaskStatusChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectTaskStatusChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectTaskStatusChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
