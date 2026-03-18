import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountingContractComponent } from './accounting-contract.component';

describe('AccountingContractComponent', () => {
  let component: AccountingContractComponent;
  let fixture: ComponentFixture<AccountingContractComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountingContractComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountingContractComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
