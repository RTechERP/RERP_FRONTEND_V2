import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectPartlistProblemComponent } from './project-partlist-problem.component';

describe('ProjectPartlistProblemComponent', () => {
  let component: ProjectPartlistProblemComponent;
  let fixture: ComponentFixture<ProjectPartlistProblemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectPartlistProblemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectPartlistProblemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
