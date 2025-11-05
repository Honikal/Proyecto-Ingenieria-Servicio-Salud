import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardSocio } from './dashboard-socio';

describe('LandingPage', () => {
  let component: DashboardSocio;
  let fixture: ComponentFixture<DashboardSocio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardSocio]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardSocio);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
