import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VehicleManagementFormComponent } from './vehicle-management-form.component';

describe('VehicleManagementFormComponent', () => {
  let component: VehicleManagementFormComponent;
  let fixture: ComponentFixture<VehicleManagementFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VehicleManagementFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VehicleManagementFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
