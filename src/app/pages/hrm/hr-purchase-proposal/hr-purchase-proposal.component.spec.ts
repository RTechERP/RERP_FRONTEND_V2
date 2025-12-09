import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HrPurchaseProposalComponent } from './hr-purchase-proposal.component';

describe('HrPurchaseProposalComponent', () => {
  let component: HrPurchaseProposalComponent;
  let fixture: ComponentFixture<HrPurchaseProposalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HrPurchaseProposalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HrPurchaseProposalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
