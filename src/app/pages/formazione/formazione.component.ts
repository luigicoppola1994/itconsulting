import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-formazione',
  imports: [],
  templateUrl: './formazione.component.html',
  styleUrl: './formazione.component.scss'
})
export class FormazioneComponent {

  constructor(private router: Router) {}

  onContactClick(): void {
    this.router.navigate(['/contatti']);
  }

  onInfoClick(): void {
    // Navigazione verso una pagina di richiesta informazioni o apertura di un modal
    this.router.navigate(['/contatti']); // Per ora verso contatti
  }
}
