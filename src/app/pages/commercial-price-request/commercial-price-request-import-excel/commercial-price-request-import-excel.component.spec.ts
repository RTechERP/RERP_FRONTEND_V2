import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommercialPriceRequestImportExcelComponent } from './commercial-price-request-import-excel.component';

describe('CommercialPriceRequestImportExcelComponent', () => {
  let component: CommercialPriceRequestImportExcelComponent;
  let fixture: ComponentFixture<CommercialPriceRequestImportExcelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommercialPriceRequestImportExcelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommercialPriceRequestImportExcelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
