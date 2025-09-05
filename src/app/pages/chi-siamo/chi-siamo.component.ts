import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chi-siamo',
  templateUrl: './chi-siamo.component.html',
  styleUrls: ['./chi-siamo.component.scss'],
  imports: [CommonModule],
  standalone: true
})
export class ChiSiamoComponent {
  teamMembers = [
    { name: 'Roey Eliyahu', photoUrl: 'percorso/alla/foto1.jpg' },
    { name: 'Michael Nicosia', photoUrl: 'percorso/alla/foto2.jpg' },
    { name: 'Ori Bach', photoUrl: 'percorso/alla/foto3.jpg' },
    { name: 'Michael Callahan', photoUrl: 'percorso/alla/foto4.jpg' }
  ];

  constructor(){ }

}