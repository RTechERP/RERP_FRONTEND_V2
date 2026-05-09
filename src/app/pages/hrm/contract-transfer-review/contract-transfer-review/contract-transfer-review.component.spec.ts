import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractTransferReviewComponent } from './contract-transfer-review.component';

describe('ContractTransferReviewComponent', () => {
  let component: ContractTransferReviewComponent;
  let fixture: ComponentFixture<ContractTransferReviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContractTransferReviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContractTransferReviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
