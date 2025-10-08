import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerCurso } from './ver-curso';

describe('VerCurso', () => {
  let component: VerCurso;
  let fixture: ComponentFixture<VerCurso>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerCurso]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerCurso);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
