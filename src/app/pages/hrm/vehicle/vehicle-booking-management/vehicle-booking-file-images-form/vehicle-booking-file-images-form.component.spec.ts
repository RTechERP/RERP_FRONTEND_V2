import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleBookingFileImagesFormComponent } from './vehicle-booking-file-images-form.component';

describe('VehicleBookingFileImagesFormComponent', () => {
  let component: VehicleBookingFileImagesFormComponent;
  let fixture: ComponentFixture<VehicleBookingFileImagesFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleBookingFileImagesFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleBookingFileImagesFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
