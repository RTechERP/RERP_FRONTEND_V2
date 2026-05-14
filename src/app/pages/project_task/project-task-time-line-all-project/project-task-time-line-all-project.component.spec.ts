import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectTaskTimeLineAllProjectComponent } from './project-task-time-line-all-project.component';

describe('ProjectTaskTimeLineAllProjectComponent', () => {
  let component: ProjectTaskTimeLineAllProjectComponent;
  let fixture: ComponentFixture<ProjectTaskTimeLineAllProjectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectTaskTimeLineAllProjectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectTaskTimeLineAllProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
