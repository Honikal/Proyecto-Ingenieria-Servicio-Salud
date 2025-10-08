import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RealizarCurso } from './realizar-curso';

describe('RealizarCurso', () => {
  let component: RealizarCurso;
  let fixture: ComponentFixture<RealizarCurso>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RealizarCurso]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RealizarCurso);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
