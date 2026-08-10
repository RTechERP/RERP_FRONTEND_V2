import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReturnedInventoryProductComponent } from './returned-inventory-product.component';

describe('ReturnedInventoryProductComponent', () => {
  let component: ReturnedInventoryProductComponent;
  let fixture: ComponentFixture<ReturnedInventoryProductComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReturnedInventoryProductComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReturnedInventoryProductComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
