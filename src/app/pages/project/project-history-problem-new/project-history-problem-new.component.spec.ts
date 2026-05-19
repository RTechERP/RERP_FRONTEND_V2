import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectHistoryProblemNewComponent } from './project-history-problem-new.component';

describe('ProjectHistoryProblemNewComponent', () => {
  let component: ProjectHistoryProblemNewComponent;
  let fixture: ComponentFixture<ProjectHistoryProblemNewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectHistoryProblemNewComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ProjectHistoryProblemNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
