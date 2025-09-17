import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SociosService, Socio } from '../socios.service';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-lista-socios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lista-socios.component.html',
  styleUrls: ['./lista-socios.component.css']
})
export class ListaSociosComponent implements OnInit {
  socios$!: Observable<Socio[]>;

  constructor(private sociosService: SociosService, private router: Router) {}

  ngOnInit(): void {
    this.socios$ = this.sociosService.getSocios();
  }

  verSocio(id?: string) {
    if (!id) return;
    this.router.navigate(['/socios', id]);
  }

  agregarSocio() {
    this.router.navigate(['/socios/registrar']);
  }
  
  volver() {
    this.router.navigate(['/']);
  }
}