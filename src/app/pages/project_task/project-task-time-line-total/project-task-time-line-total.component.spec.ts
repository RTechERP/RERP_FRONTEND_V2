import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectTaskTimeLineTotalComponent } from './project-task-time-line-total.component';

describe('ProjectTaskTimeLineTotalComponent', () => {
  let component: ProjectTaskTimeLineTotalComponent;
  let fixture: ComponentFixture<ProjectTaskTimeLineTotalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectTaskTimeLineTotalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectTaskTimeLineTotalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
