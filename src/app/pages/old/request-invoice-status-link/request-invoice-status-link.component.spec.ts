import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestInvoiceStatusLinkComponent } from './request-invoice-status-link.component';

describe('RequestInvoiceStatusLinkComponent', () => {
  let component: RequestInvoiceStatusLinkComponent;
  let fixture: ComponentFixture<RequestInvoiceStatusLinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestInvoiceStatusLinkComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequestInvoiceStatusLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
