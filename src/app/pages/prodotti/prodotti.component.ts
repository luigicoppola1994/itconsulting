import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-prodotti',
  imports: [],
  templateUrl: './prodotti.component.html',
  styleUrl: './prodotti.component.scss'
})
export class ProdottiComponent {

  constructor(private router: Router) {}

  onContactClick(): void {
    this.router.navigate(['/contatti']);
  }

  onConsultingClick(): void {
    this.router.navigate(['/consulenza']);
  }
}
