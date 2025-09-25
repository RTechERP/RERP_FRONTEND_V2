import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuotationSaleComponent } from './quotation-sale.component';

describe('QuotationSaleComponent', () => {
  let component: QuotationSaleComponent;
  let fixture: ComponentFixture<QuotationSaleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuotationSaleComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuotationSaleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
