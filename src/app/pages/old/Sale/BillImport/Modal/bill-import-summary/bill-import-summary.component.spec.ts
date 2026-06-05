import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillImportSummaryComponent } from './bill-import-summary.component';

describe('BillImportSummaryComponent', () => {
  let component: BillImportSummaryComponent;
  let fixture: ComponentFixture<BillImportSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillImportSummaryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillImportSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
