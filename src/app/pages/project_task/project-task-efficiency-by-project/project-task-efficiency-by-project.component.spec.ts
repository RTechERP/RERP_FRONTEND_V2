import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectTaskEfficiencyByProjectComponent } from './project-task-efficiency-by-project.component';

describe('ProjectTaskEfficiencyByProjectComponent', () => {
  let component: ProjectTaskEfficiencyByProjectComponent;
  let fixture: ComponentFixture<ProjectTaskEfficiencyByProjectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectTaskEfficiencyByProjectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectTaskEfficiencyByProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
