import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

interface Avatar {
  name: string;
  image: string;
  link: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  avatars: Avatar[] = [
    { name: 'VALE', image: '/assets/avatars/mioavatar.png', link: 'vale' },
    { name: 'CHI SIAMO', image: '/assets/avatars/mioavatar.png', link: 'chi-siamo' },
    { name: 'CONTATTI', image: '/assets/avatars/mioavatar.png', link: 'contatti' },
    { name: 'PRODOTTI', image: '/assets/avatars/mioavatar.png', link: 'prodotti' },
    { name: 'CONSULENZA', image: '/assets/avatars/mioavatar.png', link: 'consulenza' },
    { name: 'FORMAZIONE', image: '/assets/avatars/mioavatar.png', link: 'formazione' }
  ];

  isExiting = false;

  constructor(private router: Router) {}

  onAvatarClick(avatar: Avatar): void {
    // Previeni click multipli
    if (this.isExiting) return;

    // Attiva l'animazione di uscita
    this.isExiting = true;

    // Aspetta che l'animazione finisca prima di navigare
    setTimeout(() => {
      this.router.navigate([avatar.link]);
    }, 400); // Durata dell'animazione ridotta a 400ms
  }
}