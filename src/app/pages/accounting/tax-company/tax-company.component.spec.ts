import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaxCompanyComponent } from './tax-company.component';

describe('TaxCompanyComponent', () => {
  let component: TaxCompanyComponent;
  let fixture: ComponentFixture<TaxCompanyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaxCompanyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaxCompanyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
