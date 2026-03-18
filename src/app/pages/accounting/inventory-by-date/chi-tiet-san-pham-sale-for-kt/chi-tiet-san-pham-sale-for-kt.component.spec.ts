import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChiTietSanPhamSaleForKtComponent } from './chi-tiet-san-pham-sale-for-kt.component';

describe('ChiTietSanPhamSaleForKtComponent', () => {
  let component: ChiTietSanPhamSaleForKtComponent;
  let fixture: ComponentFixture<ChiTietSanPhamSaleForKtComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChiTietSanPhamSaleForKtComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChiTietSanPhamSaleForKtComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
