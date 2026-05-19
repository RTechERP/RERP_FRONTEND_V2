import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerIndustryFormComponent } from './customer-industry-form.component';

describe('CustomerIndustryFormComponent', () => {
  let component: CustomerIndustryFormComponent;
  let fixture: ComponentFixture<CustomerIndustryFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerIndustryFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerIndustryFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
