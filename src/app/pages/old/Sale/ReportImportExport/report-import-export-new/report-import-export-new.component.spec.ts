import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportImportExportNewComponent } from './report-import-export-new.component';

describe('ReportImportExportNewComponent', () => {
  let component: ReportImportExportNewComponent;
  let fixture: ComponentFixture<ReportImportExportNewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportImportExportNewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportImportExportNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
