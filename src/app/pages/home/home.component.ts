import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ConversationService } from '../../services/conversation.service';
import { Subject, takeUntil } from 'rxjs';

interface Avatar {
  name: string;
  image: string;
  link: string;
  color?: string;
}

interface ConversationState {
  status: 'connected' | 'connecting' | 'disconnected';
  mode: 'speaking' | 'listening' | 'idle';
  currentAgent: any;
  conversationId?: string;
  lastMessage?: string;
  error?: string;
  inputVolume: number;
  outputVolume: number;
  isAgentSpeaking: boolean;
  isUserSpeaking: boolean;
  visualState: 'idle' | 'connecting' | 'listening' | 'speaking' | 'processing' | 'error';
  lastSpeaker: 'agent' | 'user' | null;
  speakingIntensity: number;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  avatars: Avatar[] = [
    { 
      name: 'VALE', 
      image: '/assets/avatars/mioavatar.png', 
      link: 'vale',
      color: '#3B82F6'
    },
    { 
      name: 'CHI SIAMO', 
      image: '/assets/icons/info-circle.svg', 
      link: 'chi-siamo',
      color: '#10B981'
    },
    { 
      name: 'CONTATTI', 
      image: '/assets/icons/phone.svg', 
      link: 'contatti',
      color: '#F59E0B'
    },
    { 
      name: 'PRODOTTI', 
      image: '/assets/icons/package.svg', 
      link: 'prodotti',
      color: '#EF4444'
    },
    { 
      name: 'CONSULENZA', 
      image: '/assets/icons/briefcase.svg', 
      link: 'consulenza',
      color: '#8B5CF6'
    },
    { 
      name: 'FORMAZIONE', 
      image: '/assets/icons/graduation-cap.svg', 
      link: 'formazione',
      color: '#EC4899'
    }
  ];

  isExiting = false;
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
    speakingIntensity: 0
  };

  selectedAgentForVoice: Avatar | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    public conversationService: ConversationService
  ) {}

  ngOnInit(): void {
    this.conversationService.conversationState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        const previousState = { ...this.conversationState };
        this.conversationState = state;
        
        this.detectAgentChange(previousState, state);
      });

    // Imposta VALE come agente predefinito
    this.selectedAgentForVoice = this.avatars[0];

    console.log('✅ HomeComponent inizializzato con sistema azioni separate');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private detectAgentChange(previousState: ConversationState, currentState: ConversationState): void {
    if (currentState.currentAgent && 
        previousState.currentAgent?.id !== currentState.currentAgent?.id) {
      
      console.log(`🔄 Rilevato cambio agente: ${previousState.currentAgent?.name} → ${currentState.currentAgent.name}`);
      
      const newSelectedAgent = this.avatars.find(avatar => 
        avatar.name === currentState.currentAgent.name
      );
      
      if (newSelectedAgent) {
        this.selectedAgentForVoice = newSelectedAgent;
        console.log(`🎯 selectedAgentForVoice aggiornato a: ${newSelectedAgent.name}`);
      }
    }
  }

  // NAVIGAZIONE: Click sull'avatar/nome (area principale)
  onAvatarClick(avatar: Avatar): void {
    if (this.isExiting) return;

    console.log('🔄 Navigazione verso:', avatar.name, avatar.link);

    this.isExiting = true;

    setTimeout(() => {
      this.router.navigate([avatar.link]);
    }, 400);
  }

  // AGGIORNATO: Ora VALE è sempre l'assistente vocale, indipendentemente dall'avatar cliccato
  onAvatarVoiceSelect(avatar: Avatar): void {
    console.log(`🎤 Selezione vocale - VALE parlerà per ${avatar.name}`);
    
    // Aggiorna l'avatar selezionato per scopi visivi, ma VALE è sempre l'assistente
    this.selectedAgentForVoice = avatar;
    
    // VALE gestisce la conversazione per tutti i contenuti
    this.handleVoiceAction();
  }

  // AGGIORNATO: VALE gestisce tutte le conversazioni
  private async handleVoiceAction(): Promise<void> {
    const currentState = this.conversationState;

    if (currentState.status === 'disconnected') {
      try {
        console.log('🚀 Avvio conversazione vocale con VALE (assistente universale)');
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

  // AGGIORNATO: VALE è sempre l'assistente vocale principale
  async onMicrophoneClick(): Promise<void> {
    if (this.conversationService.isConnected()) {
      await this.endVoiceConversation();
    } else {
      await this.startVoiceConversation();
    }
  }

  private async startVoiceConversation(): Promise<void> {
    try {
      console.log('🚀 Avvio conversazione con VALE (assistente universale)');
      await this.conversationService.startConversation('vale');
    } catch (error) {
      console.error('Errore nell\'avvio della conversazione vocale:', error);
    }
  }

  private async endVoiceConversation(): Promise<void> {
    try {
      console.log('🔚 Terminazione conversazione con VALE');
      await this.conversationService.endConversation();
    } catch (error) {
      console.error('Errore nella chiusura della conversazione vocale:', error);
    }
  }

  getVoiceControlText(): string {
    return 'CLICCA PER PARLARE';
  }

  getCurrentAgentName(): string {
    // VALE è sempre l'assistente vocale
    return 'VALE';
  }

  isAvatarSelectedForVoice(avatar: Avatar): boolean {
    return this.selectedAgentForVoice?.name === avatar.name;
  }

  isAvatarConnected(avatar: Avatar): boolean {
    // VALE è sempre connesso quando c'è una conversazione attiva, 
    // ma visivamente mostra solo per l'avatar selezionato
    return this.conversationState.status === 'connected' && 
           this.selectedAgentForVoice?.name === avatar.name;
  }

  isAvatarSpeaking(avatar: Avatar): boolean {
    // VALE parla, ma visivamente si illumina solo l'avatar selezionato
    return this.isAvatarConnected(avatar) && 
           this.conversationState.isAgentSpeaking;
  }

  getAvatarIllumination(avatar: Avatar): string {
    if (this.isAvatarSpeaking(avatar)) {
      // VALE è sempre l'agente attivo, usa il suo colore
      return '#3B82F6';
    } else if (this.isAvatarConnected(avatar)) {
      // VALE connesso, usa colore con trasparenza
      return '#3B82F680';
    }
    return 'transparent';
  }

  getAvatarPulseIntensity(avatar: Avatar): number {
    if (this.isAvatarSpeaking(avatar)) {
      return this.conversationState.speakingIntensity;
    }
    return 0;
  }

  getAvatarStyles(avatar: Avatar): { [key: string]: string } {
    const illumination = this.getAvatarIllumination(avatar);
    const intensity = this.getAvatarPulseIntensity(avatar);
    
    if (this.isAvatarConnected(avatar)) {
      console.log(`🎨 Stili per ${avatar.name}:`, {
        illumination,
        intensity,
        currentAgentColor: this.conversationState.currentAgent?.color,
        avatarColor: avatar.color,
        visualState: this.conversationState.visualState,
        isAgentSpeaking: this.conversationState.isAgentSpeaking,
        isUserSpeaking: this.conversationState.isUserSpeaking
      });
    }
    
    return {
      '--avatar-glow-color': illumination,
      '--avatar-pulse-intensity': intensity.toString(),
      '--avatar-border-color': this.isAvatarConnected(avatar) ? illumination : '',
      '--avatar-speaking-scale': this.isAvatarSpeaking(avatar) ? '1.1' : '1'
    };
  }

  getAvatarClasses(avatar: Avatar): string[] {
    const classes: string[] = [];
    
    if (this.isExiting) {
      classes.push('clicked');
    }
    
    if (this.isAvatarSelectedForVoice(avatar)) {
      classes.push('voice-selected');
    }
    
    if (this.isAvatarConnected(avatar)) {
      classes.push('voice-connected');
    }
    
    if (this.isAvatarSpeaking(avatar)) {
      classes.push('speaking');
    }
    
    if (this.conversationState.isUserSpeaking && this.isAvatarConnected(avatar)) {
      classes.push('user-speaking');
    }
    
    return classes;
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
    // VALE è sempre l'agente attivo, usa sempre il suo colore
    const valeColor = '#3B82F6';
    
    console.log(`🎨 Voice Control Bar - VALE (assistente universale), Colore: ${valeColor}`);
    
    return {
      '--current-agent-color': valeColor,
      '--speaking-intensity': this.conversationState.speakingIntensity.toString()
    };
  }

  debugCurrentState(): void {
    console.log('🔍 Debug Stato VALE:', {
      selectedAgentForVoice: this.selectedAgentForVoice?.name,
      valeActive: 'SEMPRE ATTIVO',
      valeColor: '#3B82F6',
      status: this.conversationState.status,
      visualState: this.conversationState.visualState,
      isAgentSpeaking: this.conversationState.isAgentSpeaking,
      isUserSpeaking: this.conversationState.isUserSpeaking,
      conversationId: this.conversationState.conversationId,
      lastMessage: this.conversationState.lastMessage,
      error: this.conversationState.error,
      inputVolume: this.conversationState.inputVolume,
      outputVolume: this.conversationState.outputVolume,
      speakingIntensity: this.conversationState.speakingIntensity
    });
  }

  forceRefreshIllumination(): void {
    console.log('🔄 Forzando aggiornamento illuminazione per VALE (assistente universale)');
    this.conversationService['updateState']({});
    setTimeout(() => {
      console.log('✅ Illuminazione VALE aggiornata');
    }, 100);
  }

  // RIMOSSO: Solo VALE è supportato, non servono più test di switch tra agenti
  testValeConnection(): void {
    console.log('🧪 Test connessione VALE');
    if (this.conversationState.status === 'connected') {
      this.conversationService.endConversation();
    } else {
      this.conversationService.startConversation('vale');
    }
  }

  // TrackBy function per ottimizzare *ngFor su mobile
  trackByAvatar(index: number, avatar: Avatar): string {
    return avatar.name;
  }
}