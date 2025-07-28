import { Component, EventEmitter, Input, Output, OnInit, OnChanges, OnDestroy, ChangeDetectionStrategy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
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
  styleUrls: ['./sidebar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarComponent implements OnInit, OnChanges, OnDestroy {
  @Input() isOpen: boolean = true;
  @Input() selectedItem: MenuItem | null = null;
  @Input() shouldAnimate: boolean = false;
  @Output() closeSidebar = new EventEmitter<void>();
  @Output() backToHome = new EventEmitter<void>();
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() voiceAction = new EventEmitter<MenuItem>(); // NUOVO OUTPUT per azioni vocali
  
  isEntering: boolean = false;
  private destroy$ = new Subject<void>();
  
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
    if (this.isOpen && this.shouldAnimate) {
      this.triggerEnterAnimation();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    const isOpenChanged = changes['isOpen'];
    const shouldAnimateChanged = changes['shouldAnimate'];
    
    console.log('🎬 Sidebar ngOnChanges:', {
      isOpen: this.isOpen,
      shouldAnimate: this.shouldAnimate,
      isOpenChanged: !!isOpenChanged,
      shouldAnimateChanged: !!shouldAnimateChanged
    });
    
    if ((isOpenChanged && this.isOpen && this.shouldAnimate) || 
        (shouldAnimateChanged && this.shouldAnimate && this.isOpen)) {
      this.triggerEnterAnimation();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private triggerEnterAnimation(): void {
    console.log('🎭 Avvio animazione sidebar');
    this.isEntering = true;
    
    setTimeout(() => {
      this.isEntering = false;
      console.log('🎭 Fine animazione sidebar');
    }, 400);
  }

  // NAVIGAZIONE: Click sull'avatar/nome
  onItemClick(item: MenuItem): void {
    console.log('🔄 Navigazione verso:', item.name, item.link);
    this.router.navigate([item.link]);
  }

  // AZIONE VOCALE: Click sul microfono
  onVoiceClick(item: MenuItem, event: Event): void {
    // Previeni la propagazione per evitare che scatti anche onItemClick
    event.stopPropagation();
    
    console.log('🎤 Azione vocale per:', item.name);
    this.voiceAction.emit(item);
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