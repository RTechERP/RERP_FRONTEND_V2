import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EconomicContractComponent } from './economic-contract.component';

describe('EconomicContractComponent', () => {
  let component: EconomicContractComponent;
  let fixture: ComponentFixture<EconomicContractComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EconomicContractComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EconomicContractComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
