import { Component, EventEmitter, Input, Output, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

interface MenuItem {
  name: string;
  image: string;
  link: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnChanges {
  @Input() isOpen: boolean = true;
  @Input() selectedItem: MenuItem | null = null;
  @Output() closeSidebar = new EventEmitter<void>();
  @Output() backToHome = new EventEmitter<void>();
  @Output() toggleSidebar = new EventEmitter<void>();

  isEntering: boolean = false;

  menuItems: MenuItem[] = [
    { name: 'VALE', image: '/assets/avatars/mioavatar.png', link: 'vale' },
    { name: 'CHI SIAMO', image: '/assets/avatars/mioavatar.png', link: 'chi-siamo' },
    { name: 'CONTATTI', image: '/assets/avatars/mioavatar.png', link: 'contatti' },
    { name: 'PRODOTTI', image: '/assets/avatars/mioavatar.png', link: 'prodotti' },
    { name: 'CONSULENZA', image: '/assets/avatars/mioavatar.png', link: 'consulenza' },
    { name: 'FORMAZIONE', image: '/assets/avatars/mioavatar.png', link: 'formazione' }
  ];

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Se la sidebar è aperta all'inizializzazione, attiva l'animazione
    if (this.isOpen) {
      this.triggerEnterAnimation();
    }
  }

  ngOnChanges(): void {
    // Quando isOpen cambia da false a true, attiva l'animazione
    if (this.isOpen && !this.isEntering) {
      this.triggerEnterAnimation();
    }
  }

  private triggerEnterAnimation(): void {
    this.isEntering = true;
    
    // Rimuovi la classe dopo che l'animazione è completata - ULTRA VELOCE
    setTimeout(() => {
      this.isEntering = false;
    }, 400); // Durata totale ridotta (0.2s slide + 0.2s items)
  }

  onItemClick(item: MenuItem): void {
    this.router.navigate([item.link]);
  }

  onCloseSidebar(): void {
    this.closeSidebar.emit();
  }

  onBackToHome(): void {
    this.backToHome.emit();
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }
}