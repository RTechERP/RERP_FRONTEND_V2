import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleRepairTypeFormComponent } from './vehicle-repair-type-form.component';

describe('VehicleRepairTypeFormComponent', () => {
  let component: VehicleRepairTypeFormComponent;
  let fixture: ComponentFixture<VehicleRepairTypeFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleRepairTypeFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleRepairTypeFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
