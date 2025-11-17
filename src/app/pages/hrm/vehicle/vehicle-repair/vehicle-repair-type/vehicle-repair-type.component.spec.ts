import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleRepairTypeComponent } from './vehicle-repair-type.component';

describe('VehicleRepairTypeComponent', () => {
  let component: VehicleRepairTypeComponent;
  let fixture: ComponentFixture<VehicleRepairTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleRepairTypeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleRepairTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
