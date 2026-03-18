import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountingContractLogComponent } from './accounting-contract-log.component';

describe('AccountingContractLogComponent', () => {
  let component: AccountingContractLogComponent;
  let fixture: ComponentFixture<AccountingContractLogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountingContractLogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountingContractLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
