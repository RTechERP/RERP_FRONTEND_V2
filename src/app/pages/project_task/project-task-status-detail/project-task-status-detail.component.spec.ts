import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectTaskStatusDetailComponent } from './project-task-status-detail.component';

describe('ProjectTaskStatusDetailComponent', () => {
  let component: ProjectTaskStatusDetailComponent;
  let fixture: ComponentFixture<ProjectTaskStatusDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectTaskStatusDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectTaskStatusDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
