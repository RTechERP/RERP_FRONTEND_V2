import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillExportPrimeComponent } from './bill-export-prime.component';

describe('BillExportPrimeComponent', () => {
  let component: BillExportPrimeComponent;
  let fixture: ComponentFixture<BillExportPrimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillExportPrimeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillExportPrimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
