import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomerPartComponent } from './customer-part.component';

describe('CustomerPartComponent', () => {
  let component: CustomerPartComponent;
  let fixture: ComponentFixture<CustomerPartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerPartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerPartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
