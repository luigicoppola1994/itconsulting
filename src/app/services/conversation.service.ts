import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';

// Importa i tipi corretti dall'SDK ElevenLabs
import { Conversation, SessionConfig, Callbacks, InputConfig, ClientToolsConfig, Role, Status, Mode } from '@11labs/client';

// Aggiorna il tipo SessionOptions
type SessionOptions = SessionConfig & Partial<Callbacks> & Partial<InputConfig> & {
  agentId: string;
  clientTools?: Record<string, (parameters: any) => string | number | void | Promise<string | number | void>>;
};

interface ConversationInstance {
  endSession(): Promise<void>;
  getId(): string;
  setVolume(options: { volume: number }): void;
  getInputVolume(): number;
  getOutputVolume(): number;
  getInputByteFrequencyData(): Uint8Array;
  getOutputByteFrequencyData(): Uint8Array;
}

interface AgentConfig {
  id: string;
  name: string;
  agentId: string;
  description: string;
  avatar?: string;
  color?: string;
}

interface ConversationState {
  status: 'connected' | 'connecting' | 'disconnected';
  mode: 'speaking' | 'listening' | 'idle';
  currentAgent: AgentConfig | null;
  conversationId?: string;
  lastMessage?: string;
  error?: string;
  inputVolume: number;
  outputVolume: number;
  sdkLoaded: boolean;
  sdkLoading: boolean;
  isAgentSpeaking: boolean;
  isUserSpeaking: boolean;
  visualState: 'idle' | 'connecting' | 'listening' | 'speaking' | 'processing' | 'error';
  lastSpeaker: 'agent' | 'user' | null;
  speakingIntensity: number;
}

@Injectable({
  providedIn: 'root'
})
export class ConversationService {
  private conversation: ConversationInstance | null = null;
  private conversationStateSubject = new BehaviorSubject<ConversationState>({
    status: 'disconnected',
    mode: 'idle',
    currentAgent: null,
    inputVolume: 0,
    outputVolume: 0,
    sdkLoaded: false,
    sdkLoading: false,
    isAgentSpeaking: false,
    isUserSpeaking: false,
    visualState: 'idle',
    lastSpeaker: null,
    speakingIntensity: 0
  });

  // Mappatura degli agenti con URL
  private agents: AgentConfig[] = [
    {
      id: 'vale',
      name: 'VALE',
      agentId: 'agent_2601k185bjhaf30tsab9mcnwc5sr',
      description: 'Assistente virtuale principale',
      avatar: '/assets/avatars/mioavatar.png',
      color: '#3B82F6'
    },
    {
      id: 'chi-siamo',
      name: 'CHI SIAMO',
      agentId: 'agent_9601k185f7zpembtqc6qhmm3ax1c',
      description: 'Esperto di informazioni aziendali',
      avatar: '/assets/avatars/mioavatar.png',
      color: '#10B981'
    },
    {
      id: 'contatti',
      name: 'CONTATTI',
      agentId: 'agent_3201k185jc6hfrsamry32ehq7jbv',
      description: 'Gestione contatti e comunicazioni',
      avatar: '/assets/avatars/mioavatar.png',
      color: '#F59E0B'
    },
    {
      id: 'prodotti',
      name: 'PRODOTTI',
      agentId: 'agent_3901k185nvsnebb99gmqk9femtwh',
      description: 'Specialista prodotti e servizi',
      avatar: '/assets/avatars/mioavatar.png',
      color: '#EF4444'
    },
    {
      id: 'consulenza',
      name: 'CONSULENZA',
      agentId: 'agent_8501k185vx3sfwevxz287jw0qs9m',
      description: 'Consulente tecnico specializzato',
      avatar: '/assets/avatars/mioavatar.png',
      color: '#8B5CF6'
    },
    {
      id: 'formazione',
      name: 'FORMAZIONE',
      agentId: 'agent_9401k18619b4fd8bcaqg0b98twzx',
      description: 'Esperto di formazione e corsi',
      avatar: '/assets/avatars/mioavatar.png',
      color: '#EC4899'
    }
  ];

  public conversationState$: Observable<ConversationState> = this.conversationStateSubject.asObservable();
  private volumeUpdateInterval?: number;
  private speakingDetectionThreshold = 0.1;

  constructor(private router: Router) {
    console.log('🎤 ConversationService inizializzato');
    this.updateState({ sdkLoaded: true });
  }

  getAgentById(agentId: string): AgentConfig | undefined {
    return this.agents.find(agent => agent.id === agentId);
  }

  getAllAgents(): AgentConfig[] {
    return this.agents;
  }

  getActiveAgent(): AgentConfig | null {
    return this.conversationStateSubject.value.currentAgent;
  }

  // METODO PRINCIPALE: Avvio conversazione
  // Aggiungi questo metodo nella tua classe ConversationService

// Aggiungi questo metodo nella tua classe ConversationService

// METODO PRINCIPALE: Avvio conversazione con tool configurati
async startConversation(agentId: string): Promise<void> {
  try {
    const agent = this.getAgentById(agentId);
    if (!agent) {
      throw new Error(`Agente ${agentId} non trovato`);
    }

    if (this.conversation) {
      await this.endConversation();
    }

    this.updateState({ 
      status: 'connecting', 
      currentAgent: { ...agent },
      error: undefined,
      visualState: 'connecting',
      isAgentSpeaking: false,
      isUserSpeaking: false,
      speakingIntensity: 0
    });

    console.log(`🔄 Avvio conversazione con ${agent.name} (colore: ${agent.color})...`);

    const sessionOptions: SessionOptions = {
      agentId: agent.agentId,
      
      // CONFIGURAZIONE DEI TOOL (formato semplificato)
      clientTools: {
        redirectToExternalURL: (parameters: any) => {
          console.log('🔧 Tool redirectToExternalURL chiamato:', parameters);
          this.handleRedirectTool(parameters);
          return `Reindirizzamento a ${parameters.url} completato`;
        },
        
        transferToAgent: (parameters: any) => {
          console.log('🔧 Tool transferToAgent chiamato:', parameters);
          this.handleAgentTransferTool(parameters);
          return `Trasferimento a ${parameters.agentName || parameters.agentId} completato`;
        }
      },
      
      onConnect: () => {
        console.log(`✅ Connesso all'agente ${agent.name}`);
        this.updateState({
          status: 'connected',
          conversationId: this.conversation?.getId(),
          error: undefined,
          visualState: 'listening',
          currentAgent: { ...agent }
        });
        this.startVolumeMonitoring();
      },

      onDisconnect: () => {
        console.log(`❌ Disconnesso dall'agente ${agent.name}`);
        this.updateState({
          status: 'disconnected',
          mode: 'idle',
          conversationId: undefined,
          visualState: 'idle',
          isAgentSpeaking: false,
          isUserSpeaking: false,
          lastSpeaker: null,
          speakingIntensity: 0
        });
        this.stopVolumeMonitoring();
      },

      onMessage: ({ message, source }: { message: string; source: Role }) => {
        console.log(`💬 Messaggio da ${source} (${agent.name}):`, message);
        const speaker: 'agent' | 'user' = String(source).toLowerCase() === 'agent' ? 'agent' : 'user';
        
        this.updateState({ 
          lastMessage: message,
          lastSpeaker: speaker
        });
      },

      onStatusChange: ({ status }: { status: Status }) => {
        console.log(`🔄 Cambio stato: ${status}`);
        this.updateState({ 
          status: status as ConversationState['status'] 
        });
        this.updateVisualStateFromStatus(status);
      },

      onModeChange: ({ mode }: { mode: Mode }) => {
        console.log(`🎤 Cambio modalità: ${mode}`);
        const internalMode = mode as ConversationState['mode'];
        
        const isAgentSpeaking = internalMode === 'speaking';
        const isUserSpeaking = internalMode === 'listening';
        
        this.updateState({ 
          mode: internalMode,
          isAgentSpeaking,
          isUserSpeaking,
          visualState: this.getVisualStateFromMode(internalMode),
          lastSpeaker: isAgentSpeaking ? 'agent' : (isUserSpeaking ? 'user' : this.conversationStateSubject.value.lastSpeaker)
        });
      },

      onError: (error: any) => {
        console.error('❌ Errore conversazione:', error);
        this.updateState({
          error: `Errore di connessione con ${agent.name}: ${error.message || error}`,
          status: 'disconnected',
          mode: 'idle',
          visualState: 'error',
          isAgentSpeaking: false,
          isUserSpeaking: false,
          speakingIntensity: 0
        });
        this.stopVolumeMonitoring();
      }
    };

    this.conversation = await Conversation.startSession(sessionOptions);
    console.log(`🚀 Conversazione avviata con ${agent.name}, ID: ${this.conversation.getId()}`);

  } catch (error) {
    console.error('❌ Errore nell\'avvio della conversazione:', error);
    this.updateState({ 
      error: error instanceof Error ? error.message : 'Errore sconosciuto nell\'avvio della conversazione',
      status: 'disconnected',
      currentAgent: null,
      visualState: 'error'
    });
    throw error;
  }
}

// Aggiorna anche i metodi handler per essere più semplici
private handleRedirectTool(parameters: any): void {
  const { url, description } = parameters;
  
  console.log(`🔗 Gestione redirect tool: ${url} (${description || 'Nessuna descrizione'})`);
  
  try {
    // Mostra notifica
    this.showNotification(description || `Reindirizzamento a ${url}...`);
    
    // Controlla se è un URL interno
    if (this.isInternalUrl(url)) {
      const route = url.startsWith('/') ? url.substring(1) : url;
      
      // Breve delay per mostrare la notifica, poi naviga
      setTimeout(() => {
        this.router.navigate([route]).then(() => {
          console.log(`✅ Navigazione completata: ${route}`);
        }).catch(error => {
          console.error('❌ Errore navigazione:', error);
        });
      }, 800);
    } else {
      // URL esterno
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  } catch (error) {
    console.error('❌ Errore nel redirect tool:', error);
  }
}

private handleAgentTransferTool(parameters: any): void {
  const { agentId, agentName } = parameters;
  
  console.log(`🔄 Tool transfer agente: ${agentId} (${agentName || 'Nome non specificato'})`);
  
  try {
    const targetAgent = this.getAgentById(agentId);
    if (targetAgent) {
      this.updateState({
        currentAgent: { ...targetAgent }
      });
      
      this.showNotification(`Trasferimento a ${targetAgent.name}...`);
      
      // Naviga alla pagina dell'agente
      setTimeout(() => {
        this.router.navigate([agentId]).then(() => {
          // Avvia la nuova conversazione dopo la navigazione
          setTimeout(() => {
            this.startConversation(agentId);
          }, 500);
        });
      }, 800);
    } else {
      console.error(`❌ Agente ${agentId} non trovato`);
      this.showNotification(`Agente ${agentId} non trovato`, 'error');
    }
  } catch (error) {
    console.error('❌ Errore nel transfer tool:', error);
    this.showNotification(`Errore nel trasferimento: ${error}`, 'error');
  }
}
  // NUOVO: Metodo per cambiare agente e chiamare il tool
  async switchAgentWithTool(newAgentId: string): Promise<void> {
    const currentState = this.conversationStateSubject.value;
    const newAgent = this.getAgentById(newAgentId);
    
    if (!newAgent) {
      console.error(`Agente ${newAgentId} non trovato`);
      return;
    }

    console.log(`🔄 Cambio agente con tool: ${currentState.currentAgent?.name} → ${newAgent.name}`);
    
    // 1. Prima aggiorna l'agente corrente per l'illuminazione
    this.updateState({
      currentAgent: { ...newAgent }
    });

    // 2. Se c'è una conversazione attiva, simula il tool call
    if (currentState.status === 'connected') {
      console.log('🔧 Simulazione tool call redirectToExternalURL...');
      
      // Simula la chiamata del tool redirectToExternalURL
      this.simulateToolCall('redirectToExternalURL', {
        url: `/${newAgentId}`,
        description: `Reindirizzamento a ${newAgent.name}`
      });
      
      // Breve delay per permettere al tool di essere processato
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 3. Procedi con il cambio effettivo dell'agente
    if (currentState.status === 'connected') {
      await this.endConversation();
    }
    
    await this.startConversation(newAgentId);
  }

  // NUOVO: Simula una chiamata al tool per testare l'integrazione
  private simulateToolCall(toolName: string, parameters: any): void {
    console.log(`🔧 Simulazione tool call: ${toolName}`, parameters);
    
    // Crea l'evento personalizzato che simula il tool call
    const toolCallEvent = new CustomEvent('elevenlabs-tool-call', {
      detail: {
        toolName,
        parameters,
        timestamp: Date.now()
      }
    });

    // Dispatch l'evento per permettere ad altri componenti di intercettarlo
    document.dispatchEvent(toolCallEvent);

    // Esegui direttamente l'azione del tool
    switch (toolName) {
      case 'redirectToExternalURL':
        this.handleRedirectTool(parameters);
        break;
      
      case 'transferToAgent':
        this.handleAgentTransferTool(parameters);
        break;
        
      default:
        console.log(`🤷 Tool sconosciuto: ${toolName}`);
    }
  }

  

  // NUOVO: Verifica se un URL è interno
  private isInternalUrl(url: string): boolean {
    const internalRoutes = [
      '/vale', '/chi-siamo', '/contatti', '/prodotti', '/consulenza', '/formazione',
      'vale', 'chi-siamo', 'contatti', 'prodotti', 'consulenza', 'formazione'
    ];

    return internalRoutes.includes(url.toLowerCase()) || 
           (url.startsWith('/') && !url.startsWith('//') && !url.includes('://'));
  }

  // NUOVO: Mostra notifica
  private showNotification(message: string, type: 'info' | 'error' = 'info'): void {
    const notification = document.createElement('div');
    const bgColor = type === 'error' ? '#EF4444' : '#3B82F6';
    
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        font-weight: 600;
        backdrop-filter: blur(10px);
        animation: slideInFromRight 0.3s ease-out;
      ">
        🔗 ${message}
      </div>
    `;
    
    // Aggiungi CSS per l'animazione se non esiste
    if (!document.getElementById('notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        @keyframes slideInFromRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Rimuovi dopo 3 secondi
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  // Metodo di cambio agente esistente (ora chiama la versione con tool)
  async switchAgent(newAgentId: string): Promise<void> {
    return this.switchAgentWithTool(newAgentId);
  }

  async endConversation(): Promise<void> {
    if (!this.conversation) {
      return;
    }

    try {
      await this.conversation.endSession();
      console.log('🔚 Conversazione terminata');
    } catch (error) {
      console.error('❌ Errore nella chiusura della conversazione:', error);
    } finally {
      this.conversation = null;
      this.stopVolumeMonitoring();
      this.updateState({
        status: 'disconnected',
        mode: 'idle',
        currentAgent: null,
        conversationId: undefined,
        lastMessage: undefined,
        error: undefined,
        inputVolume: 0,
        outputVolume: 0,
        visualState: 'idle',
        isAgentSpeaking: false,
        isUserSpeaking: false,
        lastSpeaker: null,
        speakingIntensity: 0
      });
    }
  }

  // HELPER METHODS
  private getVisualStateFromMode(mode: ConversationState['mode']): ConversationState['visualState'] {
    switch (mode) {
      case 'speaking': return 'speaking';
      case 'listening': return 'listening';
      case 'idle': return 'idle';
      default: return 'idle';
    }
  }

  private updateVisualStateFromStatus(status: Status): void {
    const currentState = this.conversationStateSubject.value;
    let newVisualState: ConversationState['visualState'] = currentState.visualState;

    const statusStr = String(status).toLowerCase();
    
    switch (statusStr) {
      case 'connected':
        newVisualState = currentState.mode === 'speaking' ? 'speaking' : 'listening';
        break;
      case 'connecting':
        newVisualState = 'connecting';
        break;
      case 'disconnected':
        newVisualState = 'idle';
        break;
    }

    if (newVisualState !== currentState.visualState) {
      this.updateState({ visualState: newVisualState });
    }
  }

  private startVolumeMonitoring(): void {
    if (this.volumeUpdateInterval) {
      clearInterval(this.volumeUpdateInterval);
    }

    this.volumeUpdateInterval = window.setInterval(() => {
      if (this.conversation) {
        try {
          const inputVolume = this.conversation.getInputVolume();
          const outputVolume = this.conversation.getOutputVolume();
          
          const currentState = this.conversationStateSubject.value;
          
          const speakingIntensity = Math.max(inputVolume, outputVolume);
          const isUserCurrentlySpeaking = inputVolume > this.speakingDetectionThreshold;
          const isAgentCurrentlySpeaking = outputVolume > this.speakingDetectionThreshold;

          if (isUserCurrentlySpeaking !== currentState.isUserSpeaking || 
              isAgentCurrentlySpeaking !== currentState.isAgentSpeaking ||
              Math.abs(speakingIntensity - currentState.speakingIntensity) > 0.05) {
            
            let newVisualState = currentState.visualState;
            
            if (isAgentCurrentlySpeaking) {
              newVisualState = 'speaking';
            } else if (isUserCurrentlySpeaking) {
              newVisualState = 'listening';
            } else if (currentState.status === 'connected') {
              newVisualState = 'idle';
            }

            this.updateState({ 
              inputVolume, 
              outputVolume,
              isUserSpeaking: isUserCurrentlySpeaking,
              isAgentSpeaking: isAgentCurrentlySpeaking,
              visualState: newVisualState,
              speakingIntensity,
              lastSpeaker: isAgentCurrentlySpeaking ? 'agent' : 
                          (isUserCurrentlySpeaking ? 'user' : currentState.lastSpeaker)
            });
          } else {
            this.updateState({ inputVolume, outputVolume });
          }
        } catch (error) {
          // Ignore errori di volume monitoring
        }
      }
    }, 100);
  }

  private stopVolumeMonitoring(): void {
    if (this.volumeUpdateInterval) {
      clearInterval(this.volumeUpdateInterval);
      this.volumeUpdateInterval = undefined;
    }
  }

  // PUBLIC METHODS
  setOutputVolume(volume: number): void {
    if (!this.conversation) {
      console.warn('⚠️ Nessuna conversazione attiva per impostare il volume');
      return;
    }

    const clampedVolume = Math.max(0, Math.min(1, volume));
    
    try {
      this.conversation.setVolume({ volume: clampedVolume });
      console.log(`🔊 Volume impostato a: ${clampedVolume}`);
    } catch (error) {
      console.error('❌ Errore nell\'impostazione del volume:', error);
    }
  }

  getCurrentConversationId(): string | null {
    return this.conversation?.getId() || null;
  }

  getInputFrequencyData(): Uint8Array | null {
    return this.conversation?.getInputByteFrequencyData() || null;
  }

  getOutputFrequencyData(): Uint8Array | null {
    return this.conversation?.getOutputByteFrequencyData() || null;
  }

  getCurrentState(): ConversationState {
    return this.conversationStateSubject.value;
  }

  private updateState(newState: Partial<ConversationState>): void {
    const currentState = this.conversationStateSubject.value;
    const updatedState = {
      ...currentState,
      ...newState
    };
    
    if (newState.currentAgent && newState.currentAgent.id !== currentState.currentAgent?.id) {
      console.log(`🎨 Cambio illuminazione: ${currentState.currentAgent?.name} (${currentState.currentAgent?.color}) → ${newState.currentAgent.name} (${newState.currentAgent.color})`);
    }
    
    this.conversationStateSubject.next(updatedState);
  }

  // STATUS METHODS
  isConnected(): boolean {
    return this.conversationStateSubject.value.status === 'connected';
  }

  isSpeaking(): boolean {
    return this.conversationStateSubject.value.isAgentSpeaking;
  }

  isListening(): boolean {
    return this.conversationStateSubject.value.isUserSpeaking;
  }

  isSDKLoaded(): boolean {
    return this.conversationStateSubject.value.sdkLoaded;
  }

  isSDKLoading(): boolean {
    return this.conversationStateSubject.value.sdkLoading;
  }

  getVisualState(): ConversationState['visualState'] {
    return this.conversationStateSubject.value.visualState;
  }

  getLastSpeaker(): 'agent' | 'user' | null {
    return this.conversationStateSubject.value.lastSpeaker;
  }

  getSpeakingIntensity(): number {
    return this.conversationStateSubject.value.speakingIntensity;
  }

  ngOnDestroy(): void {
    this.endConversation();
    this.stopVolumeMonitoring();
  }
}