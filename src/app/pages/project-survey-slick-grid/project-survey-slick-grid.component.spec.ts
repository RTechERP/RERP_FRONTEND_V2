import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectSurveySlickGridComponent } from './project-survey-slick-grid.component';

describe('ProjectSurveySlickGridComponent', () => {
  let component: ProjectSurveySlickGridComponent;
  let fixture: ComponentFixture<ProjectSurveySlickGridComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectSurveySlickGridComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectSurveySlickGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
