import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectTaskTypeComponent } from './project-task-type.component';

describe('ProjectTaskTypeComponent', () => {
  let component: ProjectTaskTypeComponent;
  let fixture: ComponentFixture<ProjectTaskTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectTaskTypeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectTaskTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
