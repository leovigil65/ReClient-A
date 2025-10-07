# Virtual Patrol Redis Queue Client

Un client React completo per leggere e visualizzare eventi di Virtual Patrol dalla coda Redis tramite API PHP.

## 🎯 Panoramica

Questo sistema è composto da:
- **Backend PHP** (`vpatrol_redis_api.php`) - API REST per accedere alla coda Redis
- **Frontend React** - Client per visualizzare eventi in tempo reale
- **Redis Queue** - Storage per eventi di Virtual Patrol

## 📋 Caratteristiche

### ✅ **Backend PHP**
- Connessione Redis con gestione automatica errori
- API RESTful completa per eventi Virtual Patrol
- Supporto per múltiple code di eventi
- Statistiche e monitoraggio in tempo reale
- Popolamento automatico con dati di esempio
- Pulizia automatica eventi vecchi

### ✅ **Frontend React**
- Visualizzazione eventi in tempo reale
- Filtri per tipo di coda/evento
- Statistiche dashboard interattiva
- Auto-refresh configurabile
- Design responsive moderno
- Gestione stati di connessione

## 🚀 Installazione e Setup

### 1. **Prerequisiti**
```bash
# PHP 7.4+ con estensione Redis
php -m | grep redis

# Redis Server
redis-server --version

# Node.js per React
node --version
npm --version
```

### 2. **Setup Redis**
```bash
# Avvia Redis server
redis-server

# Oppure con Docker
docker run -d --name redis-vpatrol -p 6379:6379 redis:alpine
```

### 3. **Setup Backend PHP**
```bash
# Il file vpatrol_redis_api.php è già pronto
# Assicurati che sia accessibile dal web server
# Esempio: http://localhost/vpatrol_redis_api.php
```

### 4. **Setup Frontend React**
```bash
# Installa dipendenze (se necessario)
npm install

# Avvia server di sviluppo
npm start
```

## 📡 API Endpoints

### **GET /**
Recupera tutti gli eventi da tutte le code
```http
GET /vpatrol_redis_api.php?limit=50
```

### **GET /{queue_name}**
Recupera eventi da una coda specifica
```http
GET /vpatrol_redis_api.php/vp_events_intrusion?limit=20
```

### **GET /stats**
Statistiche complete delle code
```http
GET /vpatrol_redis_api.php/stats
```

### **GET /status**
Stato connessione Redis
```http
GET /vpatrol_redis_api.php/status
```

### **POST /{queue_name}**
Aggiunge nuovo evento
```http
POST /vpatrol_redis_api.php/vp_events_intrusion
Content-Type: application/json

{
  "event_type": "intrusion",
  "camera_id": "CAM_001",
  "title": "Motion detected",
  "metadata": {
    "severity": "high",
    "zone": "Entrance A"
  }
}
```

### **POST /clean**
Pulisce eventi vecchi
```http
POST /vpatrol_redis_api.php/clean
Content-Type: application/json

{
  "max_age": 86400
}
```

## 🗂️ Code Redis Supportate

| Nome Coda | Descrizione | Tipo Eventi |
|-----------|-------------|-------------|
| `vp_events_intrusion` | Eventi di intrusione | Rilevamenti movimento/presenza |
| `vp_events_confirmed_intrusion` | Intrusioni confermate | Eventi verificati AI/operatore |
| `vp_events_camera_offline` | Camere offline | Disconnessioni/malfunzionamenti |
| `vp_events_motion` | Rilevamento movimento | Movimenti generici |
| `vp_events_alert` | Avvisi sistema | Alerting generale |

## 🎛️ Funzionalità Client React

### **Dashboard Statistiche**
- 📊 Contatori per severità (Critical, High, Medium, Low)
- 📈 Statistiche per tipo di evento
- 🗂️ Contatori per coda
- ⏰ Timestamp ultimo aggiornamento

### **Filtri e Controlli**
- 🔽 Selezione coda specifica o "All Events"
- 🔄 Auto-refresh ogni 5 secondi (configurabile)
- 🆕 Pulsante "Add Test Event"
- 🧹 Pulizia eventi vecchi
- 🔃 Refresh manuale

### **Visualizzazione Eventi**
- 📋 Lista dettagliata con metadati
- 🎨 Codifica colori per severità
- 📱 Design responsive
- 📄 Visualizzazione JSON raw espandibile
- ⏰ Timestamp formattato

## 🔧 Configurazione

### **PHP API**
Modifica `vpatrol_redis_api.php` per:
```php
// Configurazione Redis
private $redis->connect('your_redis_host', 6379);

// Code personalizzate
$this->eventQueues = [
    'your_custom_queue' => 'Your Custom Events',
    // ...
];
```

### **React Client**
Modifica `VirtualPatrolListener.js` per:
```javascript
// URL API base
const API_BASE = '/your_api_path/vpatrol_redis_api.php';

// Intervallo auto-refresh
const interval = setInterval(() => {
    // ...
}, 10000); // 10 secondi
```

## 🧪 Testing

### **1. Test Connessione Redis**
```bash
# Verifica Redis
redis-cli ping
# Risposta: PONG

# Verifica API
curl http://localhost/vpatrol_redis_api.php/status
```

### **2. Test Evento di Esempio**
```bash
curl -X POST http://localhost/vpatrol_redis_api.php/vp_events_intrusion \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "intrusion",
    "camera_id": "CAM_TEST",
    "title": "Test intrusion",
    "metadata": {"severity": "high"}
  }'
```

### **3. Test Frontend**
1. Apri http://localhost:3030
2. Verifica connessione Redis (indicatore verde)
3. Clicca "Add Test Event"
4. Verifica che l'evento appaia nella lista

## 📊 Struttura Evento

```json
{
  "id": "vp_events_intrusion_0_1696694400",
  "event_type": "intrusion",
  "camera_id": "CAM_001", 
  "timestamp": "2025-10-07T14:30:00Z",
  "title": "Motion detected in restricted area",
  "queue_name": "vp_events_intrusion",
  "queue_display": "Intrusion Events",
  "position": 1,
  "metadata": {
    "detection_count": 3,
    "avg_confidence": 87.5,
    "json_path": "/data/detections/cam001_1696694400.json",
    "image_path": "/data/images/cam001_1696694400.jpg",
    "zone": "Entrance A",
    "severity": "high"
  }
}
```

## 🔧 Troubleshooting

### **Redis non si connette**
```bash
# Verifica servizio Redis
sudo systemctl status redis
sudo systemctl start redis

# Oppure Docker
docker ps | grep redis
docker start redis-vpatrol
```

### **API PHP non funziona**
```bash
# Verifica estensione Redis PHP
php -m | grep redis

# Log errori PHP
tail -f /var/log/apache2/error.log
```

### **CORS Errors**
Aggiungi nel tuo web server:
```apache
# .htaccess
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, OPTIONS"
Header always set Access-Control-Allow-Headers "Content-Type"
```

### **Eventi non appaiono**
1. Verifica connessione Redis ✅
2. Controlla che le code esistano in Redis
3. Verifica log PHP per errori
4. Testa API direttamente con curl

## 🚀 Produzione

### **Sicurezza**
- 🔐 Implementa autenticazione API
- 🛡️ Valida input più rigorosamente
- 🚫 Disabilita errori dettagliati
- 📝 Abilita logging di sicurezza

### **Performance**
- ⚡ Implementa caching Redis
- 📊 Monitora performance code
- 🗂️ Imposta limite massimo eventi
- 🧹 Scheduled cleanup automatico

### **Monitoraggio**
- 📈 Metriche Redis
- 🔍 Health checks API
- ⚠️ Alerting per disconnessioni
- 📊 Dashboard operative

## 📞 Supporto

Per problemi:
1. 🔍 Controlla logs PHP e Redis
2. ✅ Verifica connessioni di rete
3. 🧪 Testa API endpoints
4. 📊 Monitora risorse sistema

**File principali:**
- `vpatrol_redis_api.php` - Backend API
- `src/components/VirtualPatrolListener.js` - Frontend React
- `src/components/VirtualPatrolListener.css` - Styling