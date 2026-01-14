import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentImportExportDetailComponent } from './document-import-export-detail.component';

describe('DocumentImportExportDetailComponent', () => {
  let component: DocumentImportExportDetailComponent;
  let fixture: ComponentFixture<DocumentImportExportDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentImportExportDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DocumentImportExportDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
