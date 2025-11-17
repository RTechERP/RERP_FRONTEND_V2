import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuotationKhDataComponent } from './quotation-kh-data.component';

describe('QuotationKhDataComponent', () => {
  let component: QuotationKhDataComponent;
  let fixture: ComponentFixture<QuotationKhDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuotationKhDataComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuotationKhDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
