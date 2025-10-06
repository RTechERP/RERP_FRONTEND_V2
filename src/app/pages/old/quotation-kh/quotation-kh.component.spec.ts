import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuotationKhComponent } from './quotation-kh.component';

describe('QuotationKhComponent', () => {
  let component: QuotationKhComponent;
  let fixture: ComponentFixture<QuotationKhComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuotationKhComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuotationKhComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
