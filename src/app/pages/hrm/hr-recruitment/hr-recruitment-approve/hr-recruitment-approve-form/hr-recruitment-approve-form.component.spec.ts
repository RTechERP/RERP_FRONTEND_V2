import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrRecruitmentApproveFormComponent } from './hr-recruitment-approve-form.component';

describe('HrRecruitmentApproveFormComponent', () => {
  let component: HrRecruitmentApproveFormComponent;
  let fixture: ComponentFixture<HrRecruitmentApproveFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HrRecruitmentApproveFormComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(HrRecruitmentApproveFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
