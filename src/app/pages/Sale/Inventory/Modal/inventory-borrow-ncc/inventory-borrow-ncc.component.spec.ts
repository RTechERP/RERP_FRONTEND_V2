import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryBorrowNCCComponent } from './inventory-borrow-ncc.component';

describe('InventoryBorrowNCCComponent', () => {
  let component: InventoryBorrowNCCComponent;
  let fixture: ComponentFixture<InventoryBorrowNCCComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryBorrowNCCComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventoryBorrowNCCComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
