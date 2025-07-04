import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectSurveyDetailComponent } from './project-survey-detail.component';

describe('ProjectSurveyDetailComponent', () => {
  let component: ProjectSurveyDetailComponent;
  let fixture: ComponentFixture<ProjectSurveyDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectSurveyDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectSurveyDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
