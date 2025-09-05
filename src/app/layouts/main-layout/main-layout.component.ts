import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';
import { HeaderComponent } from '../../components/header/header.component';
import { ConversationService, ConversationState } from '../../services/conversation.service';

interface MenuItem {
  name: string;
  image: string;
  link: string;
}

interface AudioDevice {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput';
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent],
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

  // Audio device management
  inputDevices: AudioDevice[] = [];
  outputDevices: AudioDevice[] = [];
  selectedInputDevice: AudioDevice | null = null;
  selectedOutputDevice: AudioDevice | null = null;
  showInputDevices: boolean = false;
  showOutputDevices: boolean = false;

  menuItems: MenuItem[] = [
    { name: 'CHI SIAMO', image: '/assets/icons/info-circle.svg', link: 'chi-siamo' },
    { name: 'VALE', image: '/assets/avatars/mioavatar.png', link: 'vale' },
    { name: 'CONTATTI', image: '/assets/icons/phone.svg', link: 'contatti' },
    { name: 'PRODOTTI', image: '/assets/icons/package.svg', link: 'prodotti' },
    { name: 'CONSULENZA', image: '/assets/icons/briefcase.svg', link: 'consulenza' },
    { name: 'FORMAZIONE', image: '/assets/icons/graduation-cap.svg', link: 'formazione' }
  ];

  constructor(
    private router: Router,
    public conversationService: ConversationService
  ) {
    this.previousUrl = this.router.url;
  }

  ngOnInit(): void {
    this.checkCurrentRoute();

    // Inizializza i dispositivi audio
    this.initializeAudioDevices();

    // Listener per chiudere i dropdown quando si clicca fuori
    document.addEventListener('click', this.handleDocumentClick.bind(this));

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
    
    // Rimuovi il listener del documento
    document.removeEventListener('click', this.handleDocumentClick.bind(this));
  }

  private async checkCurrentRoute(url?: string): Promise<void> {
    const currentUrl = url || this.router.url;
    
    // VALE è sempre attivo, indipendentemente dalla pagina
    await this.conversationService.setActiveAgentByRoute(currentUrl);
    
    if (currentUrl === '/' || currentUrl === '/home') {
      this.showSidebar = false;
      this.selectedMenuItem = null;
    } else {
      const routePath = currentUrl.startsWith('/') ? currentUrl.substring(1) : currentUrl;
      const matchingItem = this.menuItems.find(item => item.link === routePath);
      
      if (matchingItem) {
        if (!this.showSidebar) {
          this.showSidebar = true;
        }
        this.selectedMenuItem = matchingItem;
      } else {
        this.showSidebar = false;
        this.selectedMenuItem = null;
      }
    }
  }

  onBackToHome(): void {
    this.shouldAnimateSidebar = false;
    this.router.navigate(['/']);
  }

  // AGGIORNATO: Ora VALE è sempre l'agente vocale, indipendentemente dalla pagina
  async onSidebarVoiceAction(item: MenuItem): Promise<void> {
    console.log('🎤 Azione vocale dalla sidebar - VALE parla per:', item.name);
    
    const currentState = this.conversationService.getCurrentState();

    if (currentState.status === 'disconnected') {
      try {
        console.log('🚀 Avvio conversazione con VALE (assistente universale)');
        await this.conversationService.startConversation('vale');
      } catch (error) {
        console.error('Errore nell\'avvio della conversazione vocale:', error);
      }
    } else if (currentState.status === 'connected') {
      try {
        console.log('🔚 Termina conversazione con VALE');
        await this.conversationService.endConversation();
      } catch (error) {
        console.error('Errore nella terminazione della conversazione:', error);
      }
    }
  }

  // AGGIORNATO: Ora VALE è sempre l'assistente vocale universale
  async onMicrophoneClick(): Promise<void> {
    const currentState = this.conversationService.getCurrentState();

    if (currentState.status === 'disconnected') {
        try {
            console.log('🚀 Avvio conversazione globale con VALE (assistente universale)');
            await this.conversationService.startConversation('vale');
        } catch (error) {
            console.error('Errore nell\'avvio della conversazione vocale globale:', error);
        }
    } else if (currentState.status === 'connected') {
        try {
            console.log('🔚 Chiusura conversazione globale con VALE.');
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

  getCurrentAgentName(): string {
    // VALE è sempre l'assistente vocale attivo
    return 'VALE';
  }

  getCurrentAgentNameForDisplay(): string {
    // VALE è sempre l'assistente vocale, ma mostra il contesto della pagina
    const pageName = this.selectedMenuItem?.name || 'HOME';
    return `VALE (su ${pageName})`;
  }

  // ============= AUDIO DEVICE MANAGEMENT =============

  async initializeAudioDevices(): Promise<void> {
    try {
      // Richiedi autorizzazioni per accedere ai dispositivi
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Ottieni la lista dei dispositivi
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      // Filtra e organizza i dispositivi
      this.inputDevices = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Microfono ${this.inputDevices.length + 1}`,
          kind: device.kind as 'audioinput'
        }));

      this.outputDevices = devices
        .filter(device => device.kind === 'audiooutput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Altoparlante ${this.outputDevices.length + 1}`,
          kind: device.kind as 'audiooutput'
        }));

      // Seleziona i dispositivi predefiniti
      this.selectedInputDevice = this.inputDevices.find(device => device.deviceId === 'default') || this.inputDevices[0] || null;
      this.selectedOutputDevice = this.outputDevices.find(device => device.deviceId === 'default') || this.outputDevices[0] || null;

      console.log('🎧 Dispositivi audio MainLayout inizializzati:', {
        input: this.inputDevices.length,
        output: this.outputDevices.length,
        selectedInput: this.selectedInputDevice?.label,
        selectedOutput: this.selectedOutputDevice?.label
      });

    } catch (error) {
      console.error('❌ Errore nell\'inizializzazione dei dispositivi audio MainLayout:', error);
      
      // Dispositivi fallback se non si riesce ad accedere ai veri dispositivi
      this.inputDevices = [{ deviceId: 'default', label: 'Microfono predefinito', kind: 'audioinput' }];
      this.outputDevices = [{ deviceId: 'default', label: 'Altoparlante predefinito', kind: 'audiooutput' }];
      this.selectedInputDevice = this.inputDevices[0];
      this.selectedOutputDevice = this.outputDevices[0];
    }
  }

  toggleInputDeviceMenu(): void {
    this.showInputDevices = !this.showInputDevices;
    this.showOutputDevices = false; // Chiudi l'altro menu
    console.log('🎤 Toggle menu dispositivi input MainLayout:', this.showInputDevices);
  }

  toggleOutputDeviceMenu(): void {
    this.showOutputDevices = !this.showOutputDevices;
    this.showInputDevices = false; // Chiudi l'altro menu
    console.log('🔊 Toggle menu dispositivi output MainLayout:', this.showOutputDevices);
  }

  selectInputDevice(device: AudioDevice): void {
    this.selectedInputDevice = device;
    this.showInputDevices = false;
    console.log('🎤 Dispositivo input selezionato MainLayout:', device.label);
    
    this.applyAudioDeviceChanges();
  }

  selectOutputDevice(device: AudioDevice): void {
    this.selectedOutputDevice = device;
    this.showOutputDevices = false;
    console.log('🔊 Dispositivo output selezionato MainLayout:', device.label);
    
    this.applyAudioDeviceChanges();
  }

  private applyAudioDeviceChanges(): void {
    // Questa funzione potrebbe essere utilizzata per applicare i cambiamenti
    // ai dispositivi audio nell'SDK ElevenLabs se supportato
    if (this.conversationState.status === 'connected') {
      console.log('🔄 Applicazione cambiamenti dispositivi audio alla conversazione attiva MainLayout');
      // TODO: Implementare se l'SDK ElevenLabs supporta il cambio dinamico di dispositivi
    }
  }

  // Gestisce i click fuori dai dropdown per chiuderli
  private handleDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    
    // Verifica se il click è avvenuto fuori dai controlli audio
    if (!target.closest('.audio-control')) {
      this.showInputDevices = false;
      this.showOutputDevices = false;
    }
  }
}