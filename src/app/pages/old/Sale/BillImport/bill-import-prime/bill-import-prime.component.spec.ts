import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillImportPrimeComponent } from './bill-import-prime.component';

describe('BillImportPrimeComponent', () => {
  let component: BillImportPrimeComponent;
  let fixture: ComponentFixture<BillImportPrimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillImportPrimeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillImportPrimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
