import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrRecruitmentInterviewAssessmentViewComponent } from './hr-recruitment-interview-assessment-view.component';

describe('HrRecruitmentInterviewAssessmentViewComponent', () => {
  let component: HrRecruitmentInterviewAssessmentViewComponent;
  let fixture: ComponentFixture<HrRecruitmentInterviewAssessmentViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HrRecruitmentInterviewAssessmentViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HrRecruitmentInterviewAssessmentViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
