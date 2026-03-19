import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryByDateComponent } from './inventory-by-date.component';

describe('InventoryByDateComponent', () => {
  let component: InventoryByDateComponent;
  let fixture: ComponentFixture<InventoryByDateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryByDateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventoryByDateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
