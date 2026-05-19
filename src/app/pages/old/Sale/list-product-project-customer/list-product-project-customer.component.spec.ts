import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListProductProjectCustomerComponent } from './list-product-project-customer.component';

describe('ListProductProjectCustomerComponent', () => {
  let component: ListProductProjectCustomerComponent;
  let fixture: ComponentFixture<ListProductProjectCustomerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListProductProjectCustomerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListProductProjectCustomerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
