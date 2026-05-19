import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractTransferReviewSendMailComponent } from './contract-transfer-review-send-mail.component';

describe('ContractTransferReviewSendMailComponent', () => {
  let component: ContractTransferReviewSendMailComponent;
  let fixture: ComponentFixture<ContractTransferReviewSendMailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContractTransferReviewSendMailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContractTransferReviewSendMailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
