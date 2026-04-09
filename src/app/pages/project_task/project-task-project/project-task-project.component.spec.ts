import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectTaskProjectComponent } from './project-task-project.component';

describe('ProjectTaskProjectComponent', () => {
  let component: ProjectTaskProjectComponent;
  let fixture: ComponentFixture<ProjectTaskProjectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectTaskProjectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectTaskProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
