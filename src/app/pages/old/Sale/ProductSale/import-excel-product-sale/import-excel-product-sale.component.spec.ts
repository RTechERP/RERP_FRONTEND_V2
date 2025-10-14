import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportExcelProductSaleComponent } from './import-excel-product-sale.component';

describe('ImportExcelProductSaleComponent', () => {
  let component: ImportExcelProductSaleComponent;
  let fixture: ComponentFixture<ImportExcelProductSaleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportExcelProductSaleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportExcelProductSaleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
