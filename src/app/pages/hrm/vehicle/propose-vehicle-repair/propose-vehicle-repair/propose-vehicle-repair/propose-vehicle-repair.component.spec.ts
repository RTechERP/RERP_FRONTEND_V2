import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProposeVehicleRepairComponent } from './propose-vehicle-repair.component';

describe('ProposeVehicleRepairComponent', () => {
  let component: ProposeVehicleRepairComponent;
  let fixture: ComponentFixture<ProposeVehicleRepairComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProposeVehicleRepairComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProposeVehicleRepairComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
