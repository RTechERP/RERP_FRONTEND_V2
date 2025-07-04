import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectSurveyComponent } from './project-survey.component';

describe('ProjectSurveyComponent', () => {
  let component: ProjectSurveyComponent;
  let fixture: ComponentFixture<ProjectSurveyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectSurveyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectSurveyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
