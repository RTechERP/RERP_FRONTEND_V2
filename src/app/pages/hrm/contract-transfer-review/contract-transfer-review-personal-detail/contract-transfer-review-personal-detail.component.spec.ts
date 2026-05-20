import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractTransferReviewPersonalDetailComponent } from './contract-transfer-review-personal-detail.component';

describe('ContractTransferReviewPersonalDetailComponent', () => {
  let component: ContractTransferReviewPersonalDetailComponent;
  let fixture: ComponentFixture<ContractTransferReviewPersonalDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContractTransferReviewPersonalDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContractTransferReviewPersonalDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
