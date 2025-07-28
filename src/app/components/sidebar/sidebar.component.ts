import { Component, EventEmitter, Input, Output, OnInit, OnChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

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
export class SidebarComponent implements OnInit, OnChanges, OnDestroy {
  @Input() isOpen: boolean = true;
  @Input() selectedItem: MenuItem | null = null;
  @Output() closeSidebar = new EventEmitter<void>();
  @Output() backToHome = new EventEmitter<void>();
  @Output() toggleSidebar = new EventEmitter<void>();

  isEntering: boolean = false;
  private destroy$ = new Subject<void>();
  private hasAnimated: boolean = false; // Flag per evitare animazioni multiple

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
    // Se la sidebar è aperta all'inizializzazione e non ha mai animato, attiva l'animazione
    if (this.isOpen && !this.hasAnimated) {
      this.triggerEnterAnimation();
    }

    // Ascolta i cambi di route per aggiornare l'item selezionato
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this.updateSelectedItem(event.url);
      });
  }

  ngOnChanges(): void {
    // Quando isOpen cambia da false a true E non ha mai animato, attiva l'animazione
    if (this.isOpen && !this.isEntering && !this.hasAnimated) {
      this.triggerEnterAnimation();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private triggerEnterAnimation(): void {
    this.isEntering = true;
    this.hasAnimated = true; // Segna che l'animazione è stata eseguita
    
    // Rimuovi la classe dopo che l'animazione è completata - ULTRA VELOCE
    setTimeout(() => {
      this.isEntering = false;
    }, 400); // Durata totale ridotta (0.2s slide + 0.2s items)
  }

  private updateSelectedItem(url: string): void {
    // Rimuovi lo slash iniziale se presente
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    
    // Trova l'item corrispondente alla route corrente
    const currentItem = this.menuItems.find(item => item.link === cleanUrl);
    if (currentItem) {
      this.selectedItem = currentItem;
    }
  }

  onItemClick(item: MenuItem): void {
    // Aggiorna immediatamente l'item selezionato senza aspettare il routing
    this.selectedItem = item;
    
    // Naviga senza ricaricare la sidebar
    this.router.navigate([item.link]);
  }

  onCloseSidebar(): void {
    this.closeSidebar.emit();
  }

  onBackToHome(): void {
    this.hasAnimated = false; // Reset per permettere l'animazione quando si torna alla home
    this.backToHome.emit();
  }

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }
}