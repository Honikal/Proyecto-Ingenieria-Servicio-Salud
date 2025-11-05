import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OtpModal } from './otp-modal';

describe('OtpModal', () => {
  let component: OtpModal;
  let fixture: ComponentFixture<OtpModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OtpModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OtpModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
