import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectTaskStatusComponent } from './project-task-status.component';

describe('ProjectTaskStatusComponent', () => {
  let component: ProjectTaskStatusComponent;
  let fixture: ComponentFixture<ProjectTaskStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectTaskStatusComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectTaskStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
