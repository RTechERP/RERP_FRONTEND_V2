import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractTransferReviewPersonalComponent } from './contract-transfer-review-personal.component';

describe('ContractTransferReviewPersonalComponent', () => {
  let component: ContractTransferReviewPersonalComponent;
  let fixture: ComponentFixture<ContractTransferReviewPersonalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContractTransferReviewPersonalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContractTransferReviewPersonalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
