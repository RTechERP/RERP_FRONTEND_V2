import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractTransferReviewDetailComponent } from './contract-transfer-review-detail.component';

describe('ContractTransferReviewDetailComponent', () => {
  let component: ContractTransferReviewDetailComponent;
  let fixture: ComponentFixture<ContractTransferReviewDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContractTransferReviewDetailComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ContractTransferReviewDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
