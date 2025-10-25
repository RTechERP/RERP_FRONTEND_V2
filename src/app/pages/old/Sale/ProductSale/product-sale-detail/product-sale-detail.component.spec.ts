import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductSaleDetailComponent } from './product-sale-detail.component';

describe('ProductSaleDetailComponent', () => {
  let component: ProductSaleDetailComponent;
  let fixture: ComponentFixture<ProductSaleDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductSaleDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductSaleDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
