import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectTaskTimelineComponent } from './project-task-timeline.component';

describe('ProjectTaskTimelineComponent', () => {
  let component: ProjectTaskTimelineComponent;
  let fixture: ComponentFixture<ProjectTaskTimelineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectTaskTimelineComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectTaskTimelineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
