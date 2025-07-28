import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { ConversationService, ConversationState } from '../../services/conversation.service';

interface MenuItem {
  name: string;
  image: string;
  link: string;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  showSidebar: boolean = false;
  selectedMenuItem: MenuItem | null = null;
  shouldAnimateSidebar: boolean = false;
  
  conversationState: ConversationState = {
    status: 'disconnected',
    mode: 'idle',
    currentAgent: null,
    inputVolume: 0,
    outputVolume: 0,
    isAgentSpeaking: false,
    isUserSpeaking: false,
    visualState: 'idle',
    lastSpeaker: null,
    speakingIntensity: 0,
    sdkLoaded: false,
    sdkLoading: false
  };

  private destroy$ = new Subject<void>();
  private previousUrl: string = '';

  menuItems: MenuItem[] = [
    { name: 'CHI SIAMO', image: '/assets/avatars/mioavatar.png', link: 'chi-siamo' },
    { name: 'VALE', image: '/assets/avatars/mioavatar.png', link: 'vale' },
    { name: 'CONTATTI', image: '/assets/avatars/mioavatar.png', link: 'contatti' },
    { name: 'PRODOTTI', image: '/assets/avatars/mioavatar.png', link: 'prodotti' },
    { name: 'CONSULENZA', image: '/assets/avatars/mioavatar.png', link: 'consulenza' },
    { name: 'FORMAZIONE', image: '/assets/avatars/mioavatar.png', link: 'formazione' }
  ];

  constructor(
    private router: Router,
    public conversationService: ConversationService
  ) {
    this.previousUrl = this.router.url;
  }

  ngOnInit(): void {
    this.checkCurrentRoute();

    this.conversationService.conversationState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.conversationState = state;
        console.log('🎭 Stato conversazione globale aggiornato:', {
          visualState: state.visualState,
          currentAgent: state.currentAgent?.name,
          color: state.currentAgent?.color
        });
      });

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe((event: NavigationEnd) => {
      const isComingFromHome = this.previousUrl === '/' || this.previousUrl === '/home' || this.previousUrl === '';
      const isGoingToSidebarPage = this.menuItems.some(item => event.urlAfterRedirects.includes(item.link));
      
      this.shouldAnimateSidebar = isComingFromHome && isGoingToSidebarPage;
      
      console.log('🔄 Navigazione:', {
        from: this.previousUrl,
        to: event.urlAfterRedirects,
        shouldAnimate: this.shouldAnimateSidebar
      });
      
      this.checkCurrentRoute(event.urlAfterRedirects);
      this.previousUrl = event.urlAfterRedirects;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async checkCurrentRoute(url?: string): Promise<void> {
    const currentUrl = url || this.router.url;
    
    if (currentUrl === '/' || currentUrl === '/home') {
      this.showSidebar = false;
      this.selectedMenuItem = null;
      await this.conversationService.setActiveAgentByRoute('');
    } else {
      const routePath = currentUrl.startsWith('/') ? currentUrl.substring(1) : currentUrl;
      const matchingItem = this.menuItems.find(item => item.link === routePath);
      
      if (matchingItem) {
        if (!this.showSidebar) {
          this.showSidebar = true;
        }
        this.selectedMenuItem = matchingItem;
        await this.conversationService.setActiveAgentByRoute(matchingItem.link);
      } else {
        this.showSidebar = false;
        this.selectedMenuItem = null;
        await this.conversationService.setActiveAgentByRoute('');
      }
    }
  }

  onBackToHome(): void {
    this.shouldAnimateSidebar = false;
    this.router.navigate(['/']);
  }

  // NUOVA FUNZIONE: Gestisce l'azione vocale dalla sidebar
  async onSidebarVoiceAction(item: MenuItem): Promise<void> {
    console.log('🎤 Azione vocale dalla sidebar per:', item.name);
    
    const currentState = this.conversationService.getCurrentState();
    const targetAgentId = item.link;

    if (currentState.status === 'disconnected') {
      try {
        console.log(`🚀 Avvio conversazione con agente: ${targetAgentId}`);
        await this.conversationService.startConversation(targetAgentId);
      } catch (error) {
        console.error('Errore nell\'avvio della conversazione vocale:', error);
      }
    } else if (currentState.status === 'connected') {
      // Se è già connesso con lo stesso agente, termina la conversazione
      if (currentState.currentAgent?.name === item.name) {
        try {
          console.log('🔚 Termina conversazione corrente');
          await this.conversationService.endConversation();
        } catch (error) {
          console.error('Errore nella terminazione della conversazione:', error);
        }
      } else {
        // Se è connesso con un agente diverso, cambia agente
        try {
          console.log(`🔄 Cambio agente da ${currentState.currentAgent?.name} a ${item.name}`);
          await this.conversationService.setActiveAgentByRoute(targetAgentId);
        } catch (error) {
          console.error('Errore nel cambio agente:', error);
        }
      }
    }
  }

  // ESISTENTE: Gestisce il microfono principale (voice control bar)
  async onMicrophoneClick(): Promise<void> {
    const currentState = this.conversationService.getCurrentState();
    let targetAgentId: string | null = null;

    if (this.selectedMenuItem) {
        targetAgentId = this.selectedMenuItem.link;
    } else {
        targetAgentId = 'vale'; 
    }

    if (!targetAgentId) {
        console.warn('Impossibile avviare la conversazione: nessun agente di destinazione identificato per questa pagina.');
        return;
    }

    if (currentState.status === 'disconnected') {
        try {
            console.log(`🚀 Avvio conversazione globale con: ${targetAgentId}`);
            await this.conversationService.startConversation(targetAgentId);
        } catch (error) {
            console.error('Errore nell\'avvio della conversazione vocale globale:', error);
        }
    } else if (currentState.status === 'connected') {
        try {
            console.log('🔚 Chiusura conversazione globale.');
            await this.conversationService.endConversation();
        } catch (error) {
            console.error('Errore nella chiusura della conversazione vocale globale:', error);
        }
    }
  }

  getVoiceControlText(): string {
    switch (this.conversationState.visualState) {
      case 'speaking': return 'STA PARLANDO';
      case 'listening': return 'STA ASCOLTANDO';
      case 'connecting': return 'CONNESSIONE...';
      case 'processing': return 'ELABORANDO...';
      case 'error': return 'ERRORE';
      case 'idle': 
        return this.conversationState.status === 'connected' ? 'CONNESSO' : 'CLICCA PER PARLARE';
      default: 
        return 'CLICCA PER PARLARE';
    }
  }

  getVoiceControlBarClasses(): string[] {
    const classes: string[] = [];
    
    switch (this.conversationState.visualState) {
      case 'connecting':
        classes.push('connecting');
        break;
      case 'speaking':
        classes.push('speaking');
        break;
      case 'listening':
        classes.push('listening');
        break;
      case 'error':
        classes.push('error');
        break;
      case 'idle':
        if (this.conversationState.status === 'connected') {
          classes.push('connected');
        }
        break;
    }
    
    return classes;
  }

  getVoiceControlBarStyles(): { [key: string]: string } {
    if (this.conversationState.currentAgent) {
      const agentColor = this.conversationState.currentAgent.color || '#3B82F6';
      
      console.log(`🎨 Voice Control Bar - Agente: ${this.conversationState.currentAgent.name}, Colore: ${agentColor}`);
      
      return {
        '--current-agent-color': agentColor,
        '--speaking-intensity': this.conversationState.speakingIntensity.toString()
      };
    }
    return {};
  }

  getCurrentAgentNameForDisplay(): string {
    if (this.conversationState.currentAgent) {
      return this.conversationState.currentAgent.name;
    }
    return this.selectedMenuItem?.name || 'SELEZIONA AGENTE';
  }
}