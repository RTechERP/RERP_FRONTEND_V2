import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerMajorComponent } from './customer-major-detail.component';

describe('CustomerMajorComponent', () => {
  let component: CustomerMajorComponent;
  let fixture: ComponentFixture<CustomerMajorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerMajorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerMajorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
