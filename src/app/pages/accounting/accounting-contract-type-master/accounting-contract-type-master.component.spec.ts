import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountingContractTypeMasterComponent } from './accounting-contract-type-master.component';

describe('AccountingContractTypeMasterComponent', () => {
  let component: AccountingContractTypeMasterComponent;
  let fixture: ComponentFixture<AccountingContractTypeMasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountingContractTypeMasterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountingContractTypeMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
