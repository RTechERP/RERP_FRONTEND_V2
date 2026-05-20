import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillExportSaleLogComponent } from './bill-export-sale-log.component';

describe('BillExportSaleLogComponent', () => {
  let component: BillExportSaleLogComponent;
  let fixture: ComponentFixture<BillExportSaleLogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillExportSaleLogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillExportSaleLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
