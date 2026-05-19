import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrRecruitmentApproveComponent } from './hr-recruitment-approve.component';

describe('HrRecruitmentApproveComponent', () => {
  let component: HrRecruitmentApproveComponent;
  let fixture: ComponentFixture<HrRecruitmentApproveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HrRecruitmentApproveComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(HrRecruitmentApproveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
