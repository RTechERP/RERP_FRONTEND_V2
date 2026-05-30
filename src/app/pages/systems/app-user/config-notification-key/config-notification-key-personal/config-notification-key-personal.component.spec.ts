import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConfigNotificationKeyPersonalComponent } from './config-notification-key-personal.component';

describe('ConfigNotificationKeyPersonalComponent', () => {
  let component: ConfigNotificationKeyPersonalComponent;
  let fixture: ComponentFixture<ConfigNotificationKeyPersonalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfigNotificationKeyPersonalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConfigNotificationKeyPersonalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
