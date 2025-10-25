import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillDocumentExportComponent } from './bill-document-export.component';

describe('BillDocumentExportComponent', () => {
  let component: BillDocumentExportComponent;
  let fixture: ComponentFixture<BillDocumentExportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillDocumentExportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillDocumentExportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
