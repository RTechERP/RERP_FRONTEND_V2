import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectItemProblemComponent } from './project-item-problem.component';

describe('ProjectItemProblemComponent', () => {
  let component: ProjectItemProblemComponent;
  let fixture: ComponentFixture<ProjectItemProblemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectItemProblemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectItemProblemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
