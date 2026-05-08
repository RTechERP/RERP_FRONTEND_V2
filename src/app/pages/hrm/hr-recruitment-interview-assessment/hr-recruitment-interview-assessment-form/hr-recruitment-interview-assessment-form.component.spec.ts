import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrRecruitmentInterviewAssessmentFormComponent } from './hr-recruitment-interview-assessment-form.component';

describe('HrRecruitmentInterviewAssessmentFormComponent', () => {
  let component: HrRecruitmentInterviewAssessmentFormComponent;
  let fixture: ComponentFixture<HrRecruitmentInterviewAssessmentFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HrRecruitmentInterviewAssessmentFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HrRecruitmentInterviewAssessmentFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
