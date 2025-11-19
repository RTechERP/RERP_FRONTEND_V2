import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectSolutionVersionDetailComponent } from './project-solution-version-detail.component';

describe('ProjectSolutionVersionDetailComponent', () => {
  let component: ProjectSolutionVersionDetailComponent;
  let fixture: ComponentFixture<ProjectSolutionVersionDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectSolutionVersionDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectSolutionVersionDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
