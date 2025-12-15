import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PurchaseRequestDemoComponent } from './purchase-request-demo.component';

describe('PurchaseRequestDemoComponent', () => {
  let component: PurchaseRequestDemoComponent;
  let fixture: ComponentFixture<PurchaseRequestDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PurchaseRequestDemoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PurchaseRequestDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
