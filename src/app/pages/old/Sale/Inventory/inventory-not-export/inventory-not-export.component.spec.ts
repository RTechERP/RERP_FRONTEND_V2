import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryNotExportComponent } from './inventory-not-export.component';

describe('InventoryNotExportComponent', () => {
  let component: InventoryNotExportComponent;
  let fixture: ComponentFixture<InventoryNotExportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryNotExportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventoryNotExportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
