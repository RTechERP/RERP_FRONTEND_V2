import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuotationKhDetailComponent } from './quotation-kh-detail.component';

describe('QuotationKhDetailComponent', () => {
  let component: QuotationKhDetailComponent;
  let fixture: ComponentFixture<QuotationKhDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuotationKhDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuotationKhDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
