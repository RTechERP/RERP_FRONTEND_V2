import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountingContractTypeMasterDetailComponent } from './accounting-contract-type-master-detail.component';

describe('AccountingContractTypeMasterDetailComponent', () => {
  let component: AccountingContractTypeMasterDetailComponent;
  let fixture: ComponentFixture<AccountingContractTypeMasterDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountingContractTypeMasterDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountingContractTypeMasterDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
