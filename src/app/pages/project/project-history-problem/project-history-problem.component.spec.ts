import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectHistoryProblemComponent } from './project-history-problem.component';

describe('ProjectHistoryProblemComponent', () => {
  let component: ProjectHistoryProblemComponent;
  let fixture: ComponentFixture<ProjectHistoryProblemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectHistoryProblemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectHistoryProblemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
