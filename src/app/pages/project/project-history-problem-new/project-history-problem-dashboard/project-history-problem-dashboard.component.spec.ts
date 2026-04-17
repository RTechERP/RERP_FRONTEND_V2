import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectHistoryProblemDashboardComponent } from './project-history-problem-dashboard.component';

describe('ProjectHistoryProblemDashboardComponent', () => {
  let component: ProjectHistoryProblemDashboardComponent;
  let fixture: ComponentFixture<ProjectHistoryProblemDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectHistoryProblemDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectHistoryProblemDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
