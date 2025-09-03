import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderTab } from "./header-tab/header-tab";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderTab],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Proyecto-Trabajadores-Salud');
}

