import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HRRecruitmentExamComponent } from './hrrecruitment-exam.component';

describe('HRRecruitmentExamComponent', () => {
  let component: HRRecruitmentExamComponent;
  let fixture: ComponentFixture<HRRecruitmentExamComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HRRecruitmentExamComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HRRecruitmentExamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
