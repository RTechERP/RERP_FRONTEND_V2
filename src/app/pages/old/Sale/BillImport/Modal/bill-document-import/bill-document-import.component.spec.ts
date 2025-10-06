import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillDocumentImportComponent } from './bill-document-import.component';

describe('BillDocumentImportComponent', () => {
  let component: BillDocumentImportComponent;
  let fixture: ComponentFixture<BillDocumentImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillDocumentImportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillDocumentImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
