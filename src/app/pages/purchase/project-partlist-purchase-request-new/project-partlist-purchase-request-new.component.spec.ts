import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectPartlistPurchaseRequestNewComponent } from './project-partlist-purchase-request-new.component';

describe('ProjectPartlistPurchaseRequestNewComponent', () => {
  let component: ProjectPartlistPurchaseRequestNewComponent;
  let fixture: ComponentFixture<ProjectPartlistPurchaseRequestNewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectPartlistPurchaseRequestNewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectPartlistPurchaseRequestNewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
