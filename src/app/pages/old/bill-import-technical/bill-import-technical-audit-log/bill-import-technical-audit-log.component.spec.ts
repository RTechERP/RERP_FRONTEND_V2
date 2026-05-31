import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillImportTechnicalAuditLogComponent } from './bill-import-technical-audit-log.component';

describe('BillImportTechnicalAuditLogComponent', () => {
  let component: BillImportTechnicalAuditLogComponent;
  let fixture: ComponentFixture<BillImportTechnicalAuditLogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillImportTechnicalAuditLogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillImportTechnicalAuditLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
