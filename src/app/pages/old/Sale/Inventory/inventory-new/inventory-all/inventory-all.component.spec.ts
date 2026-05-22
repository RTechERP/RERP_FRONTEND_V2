import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryAllComponent } from './inventory-all.component';

describe('InventoryAllComponent', () => {
  let component: InventoryAllComponent;
  let fixture: ComponentFixture<InventoryAllComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryAllComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventoryAllComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
