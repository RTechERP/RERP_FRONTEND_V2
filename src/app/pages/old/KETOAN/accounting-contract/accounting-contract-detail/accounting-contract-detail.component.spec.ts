import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountingContractDetailComponent } from './accounting-contract-detail.component';

describe('AccountingContractDetailComponent', () => {
  let component: AccountingContractDetailComponent;
  let fixture: ComponentFixture<AccountingContractDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountingContractDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountingContractDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
