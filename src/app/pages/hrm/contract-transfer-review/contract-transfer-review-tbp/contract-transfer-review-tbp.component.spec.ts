import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractTransferReviewTbpComponent } from './contract-transfer-review-tbp.component';

describe('ContractTransferReviewTbpComponent', () => {
  let component: ContractTransferReviewTbpComponent;
  let fixture: ComponentFixture<ContractTransferReviewTbpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContractTransferReviewTbpComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContractTransferReviewTbpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
