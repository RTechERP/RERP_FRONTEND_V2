import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractTransferReviewBgdComponent } from './contract-transfer-review-bgd.component';

describe('ContractTransferReviewBgdComponent', () => {
  let component: ContractTransferReviewBgdComponent;
  let fixture: ComponentFixture<ContractTransferReviewBgdComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContractTransferReviewBgdComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContractTransferReviewBgdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
