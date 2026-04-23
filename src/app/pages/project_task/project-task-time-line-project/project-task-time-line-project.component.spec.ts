import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectTaskTimeLineProjectComponent } from './project-task-time-line-project.component';

describe('ProjectTaskTimeLineProjectComponent', () => {
  let component: ProjectTaskTimeLineProjectComponent;
  let fixture: ComponentFixture<ProjectTaskTimeLineProjectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectTaskTimeLineProjectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectTaskTimeLineProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
