import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleBookingManagementComponent } from './vehicle-booking-management.component';

describe('VehicleBookingManagementComponent', () => {
  let component: VehicleBookingManagementComponent;
  let fixture: ComponentFixture<VehicleBookingManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleBookingManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleBookingManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
