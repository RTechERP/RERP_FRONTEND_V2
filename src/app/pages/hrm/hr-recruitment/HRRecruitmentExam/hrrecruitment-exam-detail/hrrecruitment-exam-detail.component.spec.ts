import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HRRecruitmentExamDetailComponent } from './hrrecruitment-exam-detail.component';

describe('HRRecruitmentExamDetailComponent', () => {
  let component: HRRecruitmentExamDetailComponent;
  let fixture: ComponentFixture<HRRecruitmentExamDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HRRecruitmentExamDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HRRecruitmentExamDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
