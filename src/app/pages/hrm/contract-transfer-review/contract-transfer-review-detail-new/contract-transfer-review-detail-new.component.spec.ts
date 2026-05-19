import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractTransferReviewDetailNewComponent } from './contract-transfer-review-detail-new.component';

describe('ContractTransferReviewDetailNewComponent', () => {
  let component: ContractTransferReviewDetailNewComponent;
  let fixture: ComponentFixture<ContractTransferReviewDetailNewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContractTransferReviewDetailNewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContractTransferReviewDetailNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
