import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportExcelPurchaseRequestDemoComponent } from './import-excel-purchase-request-demo.component';

describe('ImportExcelPurchaseRequestDemoComponent', () => {
  let component: ImportExcelPurchaseRequestDemoComponent;
  let fixture: ComponentFixture<ImportExcelPurchaseRequestDemoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportExcelPurchaseRequestDemoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportExcelPurchaseRequestDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
