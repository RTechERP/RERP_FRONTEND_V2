import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestInvoiceStatusDetailComponent } from './request-invoice-status-detail.component';

describe('RequestInvoiceStatusDetailComponent', () => {
  let component: RequestInvoiceStatusDetailComponent;
  let fixture: ComponentFixture<RequestInvoiceStatusDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestInvoiceStatusDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequestInvoiceStatusDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
