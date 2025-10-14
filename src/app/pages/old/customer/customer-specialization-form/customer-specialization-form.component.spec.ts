import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerSpecializationFormComponent } from './customer-specialization-form.component';

describe('CustomerSpecializationFormComponent', () => {
  let component: CustomerSpecializationFormComponent;
  let fixture: ComponentFixture<CustomerSpecializationFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerSpecializationFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerSpecializationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
