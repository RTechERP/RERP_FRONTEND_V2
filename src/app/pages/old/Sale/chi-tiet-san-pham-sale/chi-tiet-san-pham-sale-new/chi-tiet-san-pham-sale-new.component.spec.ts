import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChiTietSanPhamSaleNewComponent } from './chi-tiet-san-pham-sale-new.component';

describe('ChiTietSanPhamSaleNewComponent', () => {
  let component: ChiTietSanPhamSaleNewComponent;
  let fixture: ComponentFixture<ChiTietSanPhamSaleNewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChiTietSanPhamSaleNewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChiTietSanPhamSaleNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
