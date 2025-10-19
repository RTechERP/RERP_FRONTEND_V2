import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductGroupDetailComponent } from './product-group-detail.component';

describe('ProductGroupDetailComponent', () => {
  let component: ProductGroupDetailComponent;
  let fixture: ComponentFixture<ProductGroupDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductGroupDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProductGroupDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
