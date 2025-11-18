import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleRepairComponentFormComponent } from './vehicle-repair-component-form.component';

describe('VehicleRepairComponentFormComponent', () => {
  let component: VehicleRepairComponentFormComponent;
  let fixture: ComponentFixture<VehicleRepairComponentFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleRepairComponentFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleRepairComponentFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
