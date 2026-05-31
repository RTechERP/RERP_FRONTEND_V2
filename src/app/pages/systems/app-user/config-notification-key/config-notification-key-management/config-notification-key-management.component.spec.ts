import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigNotificationKeyManagementComponent } from './config-notification-key-management.component';

describe('ConfigNotificationKeyManagementComponent', () => {
  let component: ConfigNotificationKeyManagementComponent;
  let fixture: ComponentFixture<ConfigNotificationKeyManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigNotificationKeyManagementComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfigNotificationKeyManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
