import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillExportTechnicalAuditLogComponent } from './bill-export-technical-audit-log.component';

describe('BillExportTechnicalAuditLogComponent', () => {
  let component: BillExportTechnicalAuditLogComponent;
  let fixture: ComponentFixture<BillExportTechnicalAuditLogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillExportTechnicalAuditLogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillExportTechnicalAuditLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
