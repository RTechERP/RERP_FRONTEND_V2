import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerIndustryComponent } from './customer-industry.component';

describe('CustomerIndustryComponent', () => {
  let component: CustomerIndustryComponent;
  let fixture: ComponentFixture<CustomerIndustryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerIndustryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerIndustryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
