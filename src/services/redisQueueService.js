// Servizio per gestire la comunicazione con Redis tramite il backend
class RedisQueueService {
  constructor() {
    this.baseURL = 'http://localhost:3001/api';
    this.ws = null;
    this.listeners = new Set();
  }

  // Connessione WebSocket per aggiornamenti in tempo reale
  connectWebSocket() {
    try {
      this.ws = new WebSocket('ws://localhost:3001');
      
      this.ws.onopen = () => {
        console.log('WebSocket connesso');
        // Richiedi i dati della coda
        this.ws.send(JSON.stringify({ type: 'get_queue' }));
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notifyListeners(data);
        } catch (error) {
          console.error('Errore parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnesso');
        // Riconnessione automatica dopo 3 secondi
        setTimeout(() => this.connectWebSocket(), 3000);
      };

      this.ws.onerror = (error) => {
        console.error('Errore WebSocket:', error);
      };
    } catch (error) {
      console.error('Errore connessione WebSocket:', error);
    }
  }

  // Aggiunge un listener per gli aggiornamenti
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notifica tutti i listeners
  notifyListeners(data) {
    this.listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Errore nel listener:', error);
      }
    });
  }

  // Legge i dati dalla coda Redis
  async getQueueData() {
    try {
      const response = await fetch(`${this.baseURL}/queue`);
      const result = await response.json();
      
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error || 'Errore nel recupero dei dati');
      }
    } catch (error) {
      console.error('Errore nel recupero dati coda:', error);
      // Ritorna dati di fallback se il server non è disponibile
      return this.getFallbackData();
    }
  }

  // Aggiunge un nuovo elemento alla coda
  async addToQueue(item) {
    try {
      const response = await fetch(`${this.baseURL}/queue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item)
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Errore nell\'aggiunta dell\'elemento');
      }
      
      return result;
    } catch (error) {
      console.error('Errore aggiunta elemento:', error);
      throw error;
    }
  }

  // Rimuove un elemento dalla coda
  async removeFromQueue(position) {
    try {
      const response = await fetch(`${this.baseURL}/queue/${position}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Errore nella rimozione dell\'elemento');
      }
      
      return result;
    } catch (error) {
      console.error('Errore rimozione elemento:', error);
      throw error;
    }
  }

  // Dati di fallback se Redis non è disponibile
  getFallbackData() {
    return [
      {
        id: 1,
        nome: 'Mario Rossi',
        email: 'mario.rossi@email.com',
        dataRegistrazione: '2025-10-01',
        position: 1,
        stato: 'In attesa'
      },
      {
        id: 2,
        nome: 'Laura Bianchi',
        email: 'laura.bianchi@email.com',
        dataRegistrazione: '2025-10-02',
        position: 2,
        stato: 'In elaborazione'
      },
      {
        id: 3,
        nome: 'Giuseppe Verdi',
        email: 'giuseppe.verdi@email.com',
        dataRegistrazione: '2025-10-03',
        position: 3,
        stato: 'In attesa'
      }
    ];
  }

  // Disconnette il WebSocket
  disconnect() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Esporta un'istanza singleton del servizio
export default new RedisQueueService();