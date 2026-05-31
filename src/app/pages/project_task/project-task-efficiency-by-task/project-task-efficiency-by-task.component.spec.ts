import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectTaskEfficiencyByTaskComponent } from './project-task-efficiency-by-task.component';

describe('ProjectTaskEfficiencyByTaskComponent', () => {
  let component: ProjectTaskEfficiencyByTaskComponent;
  let fixture: ComponentFixture<ProjectTaskEfficiencyByTaskComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectTaskEfficiencyByTaskComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectTaskEfficiencyByTaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
