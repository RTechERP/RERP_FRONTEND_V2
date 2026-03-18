import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillDocumentImportTypeComponent } from './bill-document-import-type.component';

describe('BillDocumentImportTypeComponent', () => {
  let component: BillDocumentImportTypeComponent;
  let fixture: ComponentFixture<BillDocumentImportTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillDocumentImportTypeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillDocumentImportTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
