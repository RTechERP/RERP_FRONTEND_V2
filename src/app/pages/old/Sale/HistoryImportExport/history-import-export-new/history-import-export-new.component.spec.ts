import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoryImportExportNewComponent } from './history-import-export-new.component';

describe('HistoryImportExportNewComponent', () => {
  let component: HistoryImportExportNewComponent;
  let fixture: ComponentFixture<HistoryImportExportNewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoryImportExportNewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HistoryImportExportNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
