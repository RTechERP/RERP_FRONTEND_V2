import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillImportSaleLogComponent } from './bill-import-sale-log.component';

describe('BillImportSaleLogComponent', () => {
  let component: BillImportSaleLogComponent;
  let fixture: ComponentFixture<BillImportSaleLogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillImportSaleLogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillImportSaleLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
