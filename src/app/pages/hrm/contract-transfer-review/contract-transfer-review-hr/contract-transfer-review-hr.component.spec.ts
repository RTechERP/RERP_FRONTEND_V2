import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractTransferReviewHrComponent } from './contract-transfer-review-hr.component';

describe('ContractTransferReviewHrComponent', () => {
  let component: ContractTransferReviewHrComponent;
  let fixture: ComponentFixture<ContractTransferReviewHrComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContractTransferReviewHrComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContractTransferReviewHrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
