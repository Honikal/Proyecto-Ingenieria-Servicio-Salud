import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SociosService, Socio } from '../socios.service';
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-gestionar-socio',
  imports: [CommonModule], 
  templateUrl: './gestionar-socio.component.html',
  styleUrls: ['./gestionar-socio.component.css']
})
export class GestionarSocioComponent implements OnInit {
  socio!: Socio;

  constructor(private route: ActivatedRoute, private sociosService: SociosService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.sociosService.getSocioById(id).subscribe(data => {
      this.socio = data;
    });
  }

  eliminar(id: string) {
    this.sociosService.deleteSocio(id).subscribe(() => {
      alert('Socio eliminado');
    });
  }

  activar(id: string) {
    alert('Socio activado: ' + id);
  }
}
