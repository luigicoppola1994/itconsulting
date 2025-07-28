import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Router } from '@angular/router';

// Importa i tipi necessari dall'SDK di ElevenLabs
import { Conversation, SessionConfig, Callbacks, InputConfig, ClientToolsConfig, Role, Status, Mode } from '@11labs/client';

// Definisce le opzioni per l'avvio di una sessione di conversazione
type SessionOptions = SessionConfig & Partial<Callbacks> & Partial<InputConfig> & {
  agentId: string;
  clientTools?: Record<string, (parameters: any) => string | number | void | Promise<string | number | void>>;
};

// Interfaccia per l'istanza della conversazione, riflette i metodi disponibili dall'SDK
interface ConversationInstance {
  endSession(): Promise<void>;
  getId(): string;
  setVolume(options: { volume: number }): void;
  getInputVolume(): number;
  getOutputVolume(): number;
  getInputByteFrequencyData(): Uint8Array;
  getOutputByteFrequencyData(): Uint8Array;
  // sendText è stato rimosso da qui in quanto non è un metodo esposto direttamente dall'SDK
  // per inviare testo arbitrario che l'agente pronuncia.
  // La pronuncia del messaggio di trasferimento deve essere gestita dalla logica dell'agente stesso
  // prima di chiamare il tool.
}

// Interfaccia per la configurazione di un singolo agente
interface AgentConfig {
  id: string; // ID interno per la gestione dell'applicazione (es. 'vale', 'contatti')
  name: string; // Nome visualizzato dell'agente
  agentId: string; // ID dell'agente sulla piattaforma ElevenLabs
  description: string; // Breve descrizione dell'agente
  avatar?: string; // Percorso dell'immagine dell'avatar
  color?: string; // Colore associato all'agente per l'interfaccia utente
}

// Interfaccia per lo stato complessivo della conversazione
export interface ConversationState {
  status: 'connected' | 'connecting' | 'disconnected'; // Stato della connessione (connesso, in connessione, disconnesso)
  mode: 'speaking' | 'listening' | 'idle'; // Modalità dell'interazione (agente parla, utente parla, inattivo)
  currentAgent: AgentConfig | null; // L'agente attualmente attivo
  conversationId?: string; // ID della sessione di conversazione corrente
  lastMessage?: string; // L'ultimo messaggio scambiato
  error?: string; // Messaggio di errore, se presente
  inputVolume: number; // Volume dell'input del microfono
  outputVolume: number; // Volume dell'output dell'agente
  sdkLoaded: boolean; // Indica se l'SDK è stato caricato
  sdkLoading: boolean; // Indica se l'SDK è in fase di caricamento
  isAgentSpeaking: boolean; // Vero se l'agente sta parlando
  isUserSpeaking: boolean; // Vero se l'utente sta parlando
  visualState: 'idle' | 'connecting' | 'listening' | 'speaking' | 'processing' | 'error'; // Stato visivo per l'UI
  lastSpeaker: 'agent' | 'user' | null; // Chi ha parlato l'ultima volta
  speakingIntensity: number; // Intensità del parlato per effetti visivi
}

@Injectable({
  providedIn: 'root'
})
export class ConversationService implements OnDestroy {
  // Istanza della conversazione ElevenLabs SDK
  private conversation: ConversationInstance | null = null;
  
  // Subject per lo stato della conversazione, utilizzato per notificare i componenti
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

  // Array di configurazioni degli agenti disponibili
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

  // Observable pubblico per permettere ai componenti di sottoscriversi allo stato della conversazione
  public conversationState$: Observable<ConversationState> = this.conversationStateSubject.asObservable();
  
  private volumeUpdateInterval?: number; // Intervallo per l'aggiornamento del volume
  private speakingDetectionThreshold = 0.1; // Soglia per rilevare il parlato

  // Costruttore del servizio, inietta il Router di Angular
  constructor(private router: Router) {
    console.log('🎤 ConversationService inizializzato');
    this.updateState({ sdkLoaded: true }); // Imposta l'SDK come caricato all'avvio del servizio
  }

  // Restituisce la configurazione di un agente tramite il suo ID interno
  getAgentById(agentId: string): AgentConfig | undefined {
    return this.agents.find(agent => agent.id === agentId);
  }

  // Restituisce tutte le configurazioni degli agenti
  getAllAgents(): AgentConfig[] {
    return this.agents;
  }

  // Restituisce l'agente attualmente attivo nella conversazione
  getActiveAgent(): AgentConfig | null {
    return this.conversationStateSubject.value.currentAgent;
  }

  /**
   * Imposta l'agente attivo per la conversazione in base al percorso della rotta fornito.
   * Gestisce l'avvio e la chiusura delle conversazioni necessarie per il cambio di agente.
   * @param routePath Il percorso della rotta della pagina (es. 'vale', 'contatti').
   */
  async setActiveAgentByRoute(routePath: string): Promise<void> {
    const cleanRoute = routePath.startsWith('/') ? routePath.substring(1) : routePath;
    const targetAgent = this.agents.find(agent => agent.id === cleanRoute);
    const currentState = this.conversationStateSubject.value;

    // Se non c'è un agente target per questa rotta e una conversazione è attiva, la termina.
    // Questo gestisce casi come la navigazione alla homepage o a una rotta non riconosciuta.
    if (!targetAgent) {
      if (currentState.status === 'connected') {
        console.log(`❌ Nessun agente per la rotta '${routePath}'. Terminando la conversazione attiva.`);
        await this.endConversation();
      }
      this.updateState({ currentAgent: null }); // Assicura che currentAgent sia null se non c'è un agente per la rotta
      return;
    }

    // Se nessun agente è attualmente attivo, o se l'agente corrente è diverso dall'agente target
    if (!currentState.currentAgent || currentState.currentAgent.id !== targetAgent.id) {
      console.log(`🔄 Rotta cambiata. Tentativo di switch/start agente a: ${targetAgent.name}`);
      
      // Termina la conversazione corrente, se presente, per stabilire una nuova connessione con il nuovo agente.
      if (currentState.status === 'connected') {
        await this.endConversation();
      }
      
      // Avvia la conversazione con il nuovo agente.
      await this.startConversation(targetAgent.id);
    } else {
      console.log(`ℹ️ Agente ${targetAgent.name} già attivo per la rotta '${routePath}'. Nessun cambio necessario.`);
      // Se lo stesso agente è già attivo, assicurati solo che lo stato visivo sia coerente
      this.updateState({ 
        currentAgent: { ...targetAgent }, // Assicura che venga usata la configurazione più recente dell'agente (es. colore)
        visualState: currentState.isAgentSpeaking ? 'speaking' : (currentState.isUserSpeaking ? 'listening' : 'idle')
      });
    }
  }

  /**
   * Avvia una nuova sessione di conversazione con l'agente specificato.
   * @param agentId L'ID interno dell'agente con cui avviare la conversazione.
   */
  async startConversation(agentId: string): Promise<void> {
    try {
      const agent = this.getAgentById(agentId);
      if (!agent) {
        throw new Error(`Agente ${agentId} non trovato`);
      }

      // Se una conversazione è già attiva con lo STESSO agente, non fare nulla
      if (this.conversationStateSubject.value.status === 'connected' && 
          this.conversationStateSubject.value.currentAgent?.id === agentId) {
        console.log(`✅ Conversazione con ${agent.name} già attiva. Nessuna azione necessaria.`);
        return;
      }

      // Termina la conversazione esistente se è con un agente DIVERSO o se deve essere resettata
      if (this.conversation && this.conversationStateSubject.value.currentAgent?.id !== agentId) {
        await this.endConversation();
      }

      // Aggiorna lo stato per indicare che la connessione è in corso
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

      // Configura le opzioni della sessione per l'SDK di ElevenLabs
      const sessionOptions: SessionOptions = {
        agentId: agent.agentId,
        
        // Definisce i tool client-side che l'agente può chiamare
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
        
        // Callback quando la connessione è stabilita
        onConnect: () => {
          console.log(`✅ Connesso all'agente ${agent.name}`);
          this.updateState({
            status: 'connected',
            conversationId: this.conversation?.getId(), // Usa optional chaining
            error: undefined,
            visualState: 'listening',
            currentAgent: { ...agent }
          });
          this.startVolumeMonitoring(); // Avvia il monitoraggio del volume
        },

        // Callback quando la connessione viene disconnessa
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
          this.stopVolumeMonitoring(); // Ferma il monitoraggio del volume
        },

        // Callback quando viene ricevuto un messaggio (testo)
        onMessage: ({ message, source }: { message: string; source: Role }) => {
          console.log(`💬 Messaggio da ${source} (${agent.name}):`, message);
          const speaker: 'agent' | 'user' = String(source).toLowerCase() === 'agent' ? 'agent' : 'user';
          
          this.updateState({ 
            lastMessage: message,
            lastSpeaker: speaker
          });
        },

        // Callback quando lo stato generale della sessione cambia
        onStatusChange: ({ status }: { status: Status }) => {
          console.log(`🔄 Cambio stato: ${status}`);
          this.updateVisualStateFromStatus(status);
        },

        // Callback quando la modalità di interazione cambia (parlato, ascolto, inattivo)
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

        // Callback in caso di errore della sessione
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

      // Avvia la sessione di conversazione con ElevenLabs
      this.conversation = await Conversation.startSession(sessionOptions);
      console.log(`🚀 Conversazione avviata con ${agent.name}, ID: ${this.conversation?.getId()}`); // Usa optional chaining

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

  /**
   * Gestisce il tool `redirectToExternalURL` chiamato dall'agente.
   * Esegue un reindirizzamento a un URL interno o esterno.
   * @param parameters I parametri del tool, inclusi `url` e `description`.
   */
  private handleRedirectTool(parameters: any): void {
    const { url, description } = parameters;
    console.log(`🔗 Gestione redirect tool: ${url} (${description || 'Nessuna descrizione'})`);
    try {
      this.showNotification(description || `Reindirizzamento a ${url}...`);
      if (this.isInternalUrl(url)) {
        const route = url.startsWith('/') ? url.substring(1) : url;
        // Naviga verso la rotta interna
        this.router.navigate([route]).catch(error => {
          console.error('❌ Errore navigazione:', error);
        });
      } else {
        // Apre un nuovo tab per URL esterni
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('❌ Errore nel redirect tool:', error);
    }
  }

  /**
   * Gestisce il tool `transferToAgent` chiamato dall'agente.
   * Avvia la navigazione verso la pagina del nuovo agente.
   * Si assume che l'agente precedente abbia già pronunciato il messaggio di trasferimento.
   * @param parameters I parametri del tool, inclusi `agentId` e `agentName`.
   */
  private async handleAgentTransferTool(parameters: any): Promise<void> {
    const { agentId, agentName } = parameters;
    console.log(`🔄 Tool transfer agente: ${agentId} (${agentName || 'Nome non specificato'})`);

    const targetAgent = this.getAgentById(agentId);

    if (!targetAgent) {
      console.error(`❌ Agente ${agentId} non trovato`);
      this.showNotification(`Agente ${agentId} non trovato`, 'error');
      return;
    }

    // A questo punto, assumiamo che l'agente precedente abbia già pronunciato il messaggio di trasferimento
    // prima di chiamare questo tool. Quindi, procediamo direttamente con la navigazione.
    console.log(`✅ Agente precedente ha chiamato il tool di trasferimento. Procedo con il reindirizzamento.`);
    this.showNotification(`Trasferimento a ${targetAgent.name}...`);

    try {
      // Esegui la navigazione immediatamente.
      // Il MainLayoutComponent rileverà il cambio di rotta e chiamerà setActiveAgentByRoute,
      // che terminerà la vecchia conversazione e avvierà quella con il nuovo agente.
      await this.router.navigate([agentId]);
      console.log(`✅ Navigazione completata per trasferimento agente: ${agentId}`);
    } catch (error) {
      console.error('❌ Errore durante la navigazione per il trasferimento:', error);
      this.showNotification(`Errore nel trasferimento: ${error}`, 'error');
    }
  }

  /**
   * Metodo per la selezione esplicita di un agente vocale, tipicamente dalla schermata iniziale.
   * Attiva la navigazione alla pagina dell'agente, e il MainLayoutComponent gestirà l'attivazione.
   * @param newAgentId L'ID interno dell'agente a cui passare.
   */
  async switchAgentWithTool(newAgentId: string): Promise<void> {
    const newAgent = this.getAgentById(newAgentId);
    if (!newAgent) {
      console.error(`Agente ${newAgentId} non trovato`);
      return;
    }

    const currentRoute = this.router.url.startsWith('/') ? this.router.url.substring(1) : this.router.url;
    if (currentRoute !== newAgentId) {
        // Se non siamo sulla pagina di destinazione, naviga lì. MainLayoutComponent gestirà quindi l'attivazione dell'agente.
        console.log(`Navigazione a ${newAgentId} per il cambio agente.`);
        this.router.navigate([newAgentId]);
    } else {
        // Se siamo già sulla pagina, attiva direttamente l'agente.
        // Questo gestisce i casi in cui l'utente clicca sull'icona del microfono sulla pagina già attiva.
        console.log(`Già sulla pagina ${newAgentId}. Attivazione diretta dell'agente.`);
        await this.setActiveAgentByRoute(newAgentId);
    }
  }

  // Metodo di compatibilità, ora chiama switchAgentWithTool
  async switchAgent(newAgentId: string): Promise<void> {
    return this.switchAgentWithTool(newAgentId);
  }

  /**
   * Termina la sessione di conversazione attiva.
   */
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
      this.conversation = null; // Resetta l'istanza della conversazione
      this.stopVolumeMonitoring(); // Ferma il monitoraggio del volume
      this.updateState({ // Resetta lo stato della conversazione
        status: 'disconnected',
        mode: 'idle',
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

  // Controlla se un URL è interno all'applicazione
  private isInternalUrl(url: string): boolean {
    const internalRoutes = [
      '/vale', '/chi-siamo', '/contatti', '/prodotti', '/consulenza', '/formazione',
      'vale', 'chi-siamo', 'contatti', 'prodotti', 'consulenza', 'formazione', '', 'home'
    ];
    const cleanUrl = url.startsWith('/') ? url.substring(1) : url;
    return internalRoutes.includes(cleanUrl.toLowerCase()) || 
           (url.startsWith('/') && !url.startsWith('//') && !url.includes('://'));
  }

  // Mostra una notifica temporanea all'utente
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
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  // Metodi di supporto per la gestione dello stato visivo
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

  // Avvia il monitoraggio del volume di input e output per aggiornare lo stato visivo
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
          // Ignora errori di monitoraggio del volume (possono verificarsi se l'audio è disabilitato rapidamente)
        }
      }
    }, 100);
  }

  // Ferma il monitoraggio del volume
  private stopVolumeMonitoring(): void {
    if (this.volumeUpdateInterval) {
      clearInterval(this.volumeUpdateInterval);
      this.volumeUpdateInterval = undefined;
    }
  }

  // Imposta il volume dell'output dell'agente
  setOutputVolume(volume: number): void {
    if (!this.conversation) {
      console.warn('⚠️ Nessuna conversazione attiva per impostare il volume');
      return;
    }

    const clampedVolume = Math.max(0, Math.min(1, volume)); // Limita il volume tra 0 e 1
    
    try {
      this.conversation.setVolume({ volume: clampedVolume });
      console.log(`🔊 Volume impostato a: ${clampedVolume}`);
    } catch (error) {
      console.error('❌ Errore nell\'impostazione del volume:', error);
    }
  }

  // Restituisce l'ID della conversazione corrente
  getCurrentConversationId(): string | null {
    return this.conversation?.getId() || null;
  }

  // Restituisce i dati di frequenza dell'input audio
  getInputFrequencyData(): Uint8Array | null {
    return this.conversation?.getInputByteFrequencyData() || null;
  }

  // Restituisce i dati di frequenza dell'output audio
  getOutputFrequencyData(): Uint8Array | null {
    return this.conversation?.getOutputByteFrequencyData() || null;
  }

  // Restituisce lo stato attuale della conversazione
  getCurrentState(): ConversationState {
    return this.conversationStateSubject.value;
  }

  // Aggiorna lo stato della conversazione e notifica i sottoscrittori
  private updateState(newState: Partial<ConversationState>): void {
    const currentState = this.conversationStateSubject.value;
    const updatedState = {
      ...currentState,
      ...newState
    };
    
    // Log per il cambio di colore dell'agente, utile per il debug visivo
    if (newState.currentAgent && newState.currentAgent.id !== currentState.currentAgent?.id) {
      console.log(`🎨 Cambio illuminazione: ${currentState.currentAgent?.name} (${currentState.currentAgent?.color}) → ${newState.currentAgent.name} (${newState.currentAgent.color})`);
    }
    
    this.conversationStateSubject.next(updatedState);
  }

  // Metodi di convenienza per controllare lo stato
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

  // Metodo chiamato quando il servizio viene distrutto (pulizia risorse)
  ngOnDestroy(): void {
    this.endConversation(); // Termina qualsiasi conversazione attiva
    this.stopVolumeMonitoring(); // Ferma il monitoraggio del volume
  }
}
