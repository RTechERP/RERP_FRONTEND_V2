import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectSolutionDetailComponent } from './project-solution-detail.component';

describe('ProjectSolutionDetailComponent', () => {
  let component: ProjectSolutionDetailComponent;
  let fixture: ComponentFixture<ProjectSolutionDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectSolutionDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectSolutionDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
