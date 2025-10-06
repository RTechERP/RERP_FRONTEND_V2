import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectWorkTimelineComponent } from './project-work-timeline.component';

describe('ProjectWorkTimelineComponent', () => {
  let component: ProjectWorkTimelineComponent;
  let fixture: ComponentFixture<ProjectWorkTimelineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectWorkTimelineComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectWorkTimelineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
