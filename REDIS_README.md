# Client Redis Queue

Un'applicazione React che si connette a una coda Redis per gestire registrazioni utenti.

## Funzionalità

- ✅ Connessione a Redis all'URL: `redis://redis:6379/0`
- ✅ Lettura in tempo reale dalla coda Redis
- ✅ Aggiunta di nuovi elementi alla coda
- ✅ Rimozione di elementi dalla coda
- ✅ Aggiornamenti automatici tramite WebSocket
- ✅ Interfaccia responsive e moderna
- ✅ Gestione degli stati di connessione
- ✅ Fallback se Redis non è disponibile

## Architettura

### Backend (server.js)
- Server Express.js che si connette a Redis
- API REST per operazioni CRUD sulla coda
- WebSocket per aggiornamenti in tempo reale
- Gestione automatica della connessione Redis

### Frontend (React)
- Componente Features.js modificato per mostrare la coda
- Servizio redisQueueService.js per comunicazione con il backend
- Interfaccia utente completa con form per aggiungere elementi

## Installazione e Avvio

### Prerequisiti
1. Node.js (versione 14 o superiore)
2. Redis server in esecuzione su `redis://redis:6379/0`

### Setup
```bash
# Installa le dipendenze (già fatto)
npm install

# Avvia sia il server che il client React
npm run dev

# Oppure avvia separatamente:
# Server backend (porta 3001)
npm run server

# Client React (porta 3000)
npm start
```

### Con Docker Redis
Se non hai Redis installato localmente, puoi avviarlo con Docker:

```bash
# Avvia Redis con Docker
docker run -d --name redis-server -p 6379:6379 redis:alpine

# Oppure con docker-compose, crea un file docker-compose.yml:
version: '3.8'
services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    command: redis-server
```

## Utilizzo

1. **Visualizzazione Coda**: La pagina mostra automaticamente tutti gli elementi nella coda Redis
2. **Aggiunta Elementi**: Usa il form per aggiungere nuovi utenti alla coda
3. **Rimozione Elementi**: Clicca il pulsante 🗑️ per rimuovere elementi
4. **Aggiornamenti Live**: I cambiamenti si riflettono automaticamente su tutti i client connessi

## Struttura Dati

Ogni elemento nella coda Redis ha la seguente struttura:

```json
{
  "nome": "Mario Rossi",
  "email": "mario.rossi@email.com",
  "dataRegistrazione": "2025-10-06",
  "stato": "In attesa"
}
```

## API Endpoints

- `GET /api/queue` - Ottieni tutti gli elementi della coda
- `POST /api/queue` - Aggiungi un nuovo elemento
- `DELETE /api/queue/:position` - Rimuovi elemento per posizione

## WebSocket Events

- `queue_data` - Dati completi della coda
- `queue_updated` - Notifica di aggiornamento della coda

## Gestione Errori

- ✅ Fallback automatico se Redis non è disponibile
- ✅ Riconnessione automatica WebSocket
- ✅ Indicatori visivi dello stato di connessione
- ✅ Messaggi di errore informativi

## File Principali

- `server.js` - Server backend Express + Redis
- `src/services/redisQueueService.js` - Servizio client per Redis
- `src/components/Features.js` - Componente React con UI della coda
- `src/App.css` - Stili per l'interfaccia

## Note Tecniche

- Il frontend non può connettersi direttamente a Redis (limitazione browser)
- Il backend fa da proxy tra React e Redis
- WebSocket utilizzati per aggiornamenti in tempo reale
- Gestione automatica della riconnessione e fallback