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
      image: '/assets/avatars/mioavatar.png', 
      link: 'chi-siamo',
      color: '#10B981'
    },
    { 
      name: 'CONTATTI', 
      image: '/assets/avatars/mioavatar.png', 
      link: 'contatti',
      color: '#F59E0B'
    },
    { 
      name: 'PRODOTTI', 
      image: '/assets/avatars/mioavatar.png', 
      link: 'prodotti',
      color: '#EF4444'
    },
    { 
      name: 'CONSULENZA', 
      image: '/assets/avatars/mioavatar.png', 
      link: 'consulenza',
      color: '#8B5CF6'
    },
    { 
      name: 'FORMAZIONE', 
      image: '/assets/avatars/mioavatar.png', 
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
    // Monitora lo stato della conversazione
    this.conversationService.conversationState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        const previousState = { ...this.conversationState };
        this.conversationState = state;
        
        // Rileva cambio di agente
        this.detectAgentChange(previousState, state);
        
        console.log('🎭 Stato conversazione aggiornato:', {
          visualState: state.visualState,
          currentAgent: state.currentAgent?.name,
          color: state.currentAgent?.color
        });
      });

    // Imposta VALE come agente predefinito
    this.selectedAgentForVoice = this.avatars[0];

    // RIMOSSO: Non servono più i callback obsoleti
    // this.conversationService.setRedirectCallback(...);
    // this.conversationService.setAgentChangeCallback(...);
    
    console.log('✅ HomeComponent inizializzato con nuovo sistema tool call');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.conversationState.status === 'connected') {
      this.conversationService.endConversation();
    }
  }

  // Rileva cambio di agente
  private detectAgentChange(previousState: ConversationState, currentState: ConversationState): void {
    if (currentState.currentAgent && 
        previousState.currentAgent?.id !== currentState.currentAgent?.id) {
      
      console.log(`🔄 Rilevato cambio agente: ${previousState.currentAgent?.name} → ${currentState.currentAgent.name}`);
      
      // Aggiorna selectedAgentForVoice per mantenere coerenza
      const newSelectedAgent = this.avatars.find(avatar => 
        avatar.name === currentState.currentAgent.name
      );
      
      if (newSelectedAgent) {
        this.selectedAgentForVoice = newSelectedAgent;
        console.log(`🎯 selectedAgentForVoice aggiornato a: ${newSelectedAgent.name}`);
      }
    }
  }

  onAvatarClick(avatar: Avatar): void {
    if (this.isExiting) return;

    if (this.conversationState.status === 'connected') {
      this.conversationService.endConversation();
    }

    this.isExiting = true;

    setTimeout(() => {
      this.router.navigate([avatar.link]);
    }, 400);
  }

  // AGGIORNATO: Usa il nuovo metodo switchAgentWithTool
  onAvatarVoiceSelect(avatar: Avatar): void {
    console.log(`🎤 Selezione vocale agente: ${avatar.name}`);
    this.selectedAgentForVoice = avatar;
    
    if (this.conversationState.status === 'connected' && 
        this.conversationState.currentAgent?.name !== avatar.name) {
      console.log(`🔄 Cambio agente con tool call da ${this.conversationState.currentAgent?.name} a ${avatar.name}`);
      
      // USA IL METODO CHE SIMULA IL TOOL CALL
      this.conversationService.switchAgentWithTool(avatar.link);
    }
  }

  async onMicrophoneClick(): Promise<void> {
    if (!this.selectedAgentForVoice) {
      console.warn('Nessun agente selezionato per la voce');
      return;
    }

    if (this.conversationState.status === 'disconnected') {
      await this.startVoiceConversation();
    } else if (this.conversationState.status === 'connected') {
      await this.endVoiceConversation();
    }
  }

  private async startVoiceConversation(): Promise<void> {
    if (!this.selectedAgentForVoice) return;

    try {
      console.log(`🚀 Avvio conversazione con: ${this.selectedAgentForVoice.name}`);
      await this.conversationService.startConversation(this.selectedAgentForVoice.link);
    } catch (error) {
      console.error('Errore nell\'avvio della conversazione vocale:', error);
    }
  }

  private async endVoiceConversation(): Promise<void> {
    try {
      await this.conversationService.endConversation();
    } catch (error) {
      console.error('Errore nella chiusura della conversazione vocale:', error);
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

  getCurrentAgentName(): string {
    if (this.conversationState.currentAgent) {
      return this.conversationState.currentAgent.name;
    }
    return this.selectedAgentForVoice?.name || 'SELEZIONA AGENTE';
  }

  isAvatarSelectedForVoice(avatar: Avatar): boolean {
    return this.selectedAgentForVoice?.name === avatar.name;
  }

  isAvatarConnected(avatar: Avatar): boolean {
    return this.conversationState.status === 'connected' && 
           this.conversationState.currentAgent?.name === avatar.name;
  }

  isAvatarSpeaking(avatar: Avatar): boolean {
    return this.isAvatarConnected(avatar) && 
           this.conversationState.isAgentSpeaking;
  }

  getAvatarIllumination(avatar: Avatar): string {
    if (this.isAvatarSpeaking(avatar)) {
      return this.conversationState.currentAgent?.color || avatar.color || '#3B82F6';
    } else if (this.isAvatarConnected(avatar)) {
      const color = this.conversationState.currentAgent?.color || avatar.color || '#3B82F6';
      return `${color}80`;
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
        avatarColor: avatar.color
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

  // METODI DI DEBUG E TEST
  debugCurrentState(): void {
    console.log('🔍 Debug Stato Corrente:', {
      selectedAgentForVoice: this.selectedAgentForVoice?.name,
      currentAgent: this.conversationState.currentAgent?.name,
      currentAgentColor: this.conversationState.currentAgent?.color,
      status: this.conversationState.status,
      visualState: this.conversationState.visualState,
      isAgentSpeaking: this.conversationState.isAgentSpeaking
    });
  }

  forceRefreshIllumination(): void {
    if (this.conversationState.currentAgent) {
      console.log(`🔄 Forzando aggiornamento illuminazione per ${this.conversationState.currentAgent.name}`);
      setTimeout(() => {
        console.log('✅ Illuminazione aggiornata');
      }, 100);
    }
  }

  testSwitchAgent(agentId: string): void {
    if (this.conversationState.status === 'connected') {
      console.log(`🧪 Test switch agent con tool: ${agentId}`);
      this.conversationService.switchAgentWithTool(agentId);
    } else {
      console.log('⚠️ Nessuna conversazione attiva - avvia prima una conversazione');
    }
  }

  // NUOVO: Test completo del flusso tool call
  testToolCallFlow(): void {
    console.log('🧪 Test flusso completo tool call');
    
    if (this.conversationState.status === 'connected') {
      // Test con diversi agenti
      const testAgents = ['contatti', 'prodotti', 'consulenza'];
      let currentIndex = 0;
      
      const testNext = () => {
        if (currentIndex < testAgents.length) {
          const agentId = testAgents[currentIndex];
          console.log(`🧪 Test ${currentIndex + 1}/${testAgents.length}: ${agentId}`);
          
          this.conversationService.switchAgentWithTool(agentId);
          currentIndex++;
          
          // Test successivo dopo 3 secondi
          setTimeout(testNext, 3000);
        } else {
          console.log('✅ Test completato');
        }
      };
      
      testNext();
    } else {
      console.log('⚠️ Nessuna conversazione attiva - avvia prima una conversazione per testare');
    }
  }
}