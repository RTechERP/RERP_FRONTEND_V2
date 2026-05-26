import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectTaskTimeLineNullComponent } from './project-task-time-line-null.component';

describe('ProjectTaskTimeLineNullComponent', () => {
  let component: ProjectTaskTimeLineNullComponent;
  let fixture: ComponentFixture<ProjectTaskTimeLineNullComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectTaskTimeLineNullComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectTaskTimeLineNullComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
