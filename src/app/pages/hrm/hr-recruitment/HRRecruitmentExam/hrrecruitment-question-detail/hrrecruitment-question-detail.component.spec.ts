import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HRRecruitmentQuestionDetailComponent } from './hrrecruitment-question-detail.component';

describe('HRRecruitmentQuestionDetailComponent', () => {
  let component: HRRecruitmentQuestionDetailComponent;
  let fixture: ComponentFixture<HRRecruitmentQuestionDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HRRecruitmentQuestionDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HRRecruitmentQuestionDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
