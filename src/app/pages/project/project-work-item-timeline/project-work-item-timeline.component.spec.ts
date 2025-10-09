import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectWorkItemTimelineComponent } from './project-work-item-timeline.component';

describe('ProjectWorkItemTimelineComponent', () => {
  let component: ProjectWorkItemTimelineComponent;
  let fixture: ComponentFixture<ProjectWorkItemTimelineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectWorkItemTimelineComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectWorkItemTimelineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
