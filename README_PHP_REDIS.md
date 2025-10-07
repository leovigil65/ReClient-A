# Redis Queue Manager PHP

Un gestore di code Redis completo implementato in PHP per gestire code di registrazioni con fallback automatico a storage in-memory.

## 📋 Caratteristiche

- ✅ **Connessione Redis** con fallback automatico
- ✅ **API RESTful** completa (GET, POST, PUT, DELETE)
- ✅ **Gestione errori** robusta
- ✅ **CORS support** per integrazioni frontend
- ✅ **Storage in-memory** come fallback
- ✅ **Statistiche** e monitoraggio
- ✅ **Interface di test** HTML inclusa

## 🚀 Installazione

### Prerequisiti

1. **PHP 7.4+** con estensione Redis
2. **Redis Server** (opzionale, funziona anche senza)

### Installazione Estensione Redis PHP

#### Windows (XAMPP/WAMP)
```bash
# Scaricare php_redis.dll appropriato per la versione PHP
# Copiare in ext/ directory
# Aggiungere a php.ini:
extension=redis
```

#### Linux/Ubuntu
```bash
sudo apt-get install php-redis
# oppure
sudo pecl install redis
```

#### Docker
```bash
docker run -d --name redis-server -p 6379:6379 redis:alpine
```

## 📁 Struttura File

```
├── redis_queue_manager.php    # Gestore principale API
├── config/
│   └── redis_config.php       # Configurazione
├── test_redis_queue.html      # Interface di test
└── README_PHP_REDIS.md        # Questa documentazione
```

## 🔧 Configurazione

Modifica `config/redis_config.php` per personalizzare:

```php
return [
    'redis' => [
        'host' => 'localhost',      // Indirizzo Redis
        'port' => 6379,             // Porta Redis
        'database' => 0,            // Database number
    ],
    'queue' => [
        'name' => 'registration_queue',  // Nome della coda
        'max_items' => 1000,             // Massimo elementi
    ]
];
```

## 📡 API Endpoints

### GET `/redis_queue_manager.php`
Recupera tutti gli elementi della coda
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "position": 1,
            "nome": "Mario Rossi",
            "email": "mario@email.com",
            "dataRegistrazione": "2025-10-07",
            "stato": "In attesa"
        }
    ],
    "count": 1,
    "source": "redis"
}
```

### POST `/redis_queue_manager.php`
Aggiunge un nuovo elemento alla coda
```json
// Request body:
{
    "nome": "Luigi Verdi",
    "email": "luigi@email.com",
    "stato": "In attesa"  // opzionale
}

// Response:
{
    "success": true,
    "message": "Elemento aggiunto alla coda",
    "data": { ... },
    "source": "redis"
}
```

### PUT `/redis_queue_manager.php/{position}`
Aggiorna un elemento esistente
```json
// Request body:
{
    "stato": "In elaborazione"
}

// Response:
{
    "success": true,
    "message": "Elemento aggiornato con successo"
}
```

### DELETE `/redis_queue_manager.php/{position}`
Rimuove un elemento dalla coda
```json
{
    "success": true,
    "message": "Elemento rimosso dalla coda"
}
```

### GET `/redis_queue_manager.php/stats`
Statistiche della coda
```json
{
    "success": true,
    "data": {
        "total": 5,
        "inAttesa": 3,
        "inElaborazione": 1,
        "completato": 1,
        "storage": "redis"
    }
}
```

### GET `/redis_queue_manager.php/status`
Stato della connessione
```json
{
    "success": true,
    "data": {
        "redis_connected": true,
        "storage_type": "redis",
        "queue_name": "registration_queue",
        "timestamp": "2025-10-07 14:30:22"
    }
}
```

### POST `/redis_queue_manager.php/populate`
Popola la coda con dati di esempio
```json
{
    "success": true,
    "message": "Coda popolata con successo"
}
```

### DELETE `/redis_queue_manager.php/clear`
Pulisce completamente la coda
```json
{
    "success": true,
    "message": "Coda pulita con successo"
}
```

## 🧪 Testing

### Interface Web di Test
Apri `test_redis_queue.html` nel browser per:
- ✅ Verificare stato connessione Redis
- ✅ Visualizzare statistiche in tempo reale
- ✅ Aggiungere/modificare/rimuovere elementi
- ✅ Testare tutte le funzionalità API

### Test con cURL

```bash
# Test connessione
curl -X GET http://localhost/redis_queue_manager.php/status

# Aggiungere elemento
curl -X POST http://localhost/redis_queue_manager.php \
  -H "Content-Type: application/json" \
  -d '{"nome":"Test User","email":"test@email.com"}'

# Leggere coda
curl -X GET http://localhost/redis_queue_manager.php

# Statistiche
curl -X GET http://localhost/redis_queue_manager.php/stats

# Rimuovere elemento (posizione 1)
curl -X DELETE http://localhost/redis_queue_manager.php/1
```

## 🔄 Modalità Fallback

Se Redis non è disponibile, il sistema automaticamente:

1. ⚠️ **Rileva disconnessione** Redis
2. 🔄 **Passa a storage in-memory**
3. 📦 **Carica dati di esempio**
4. ✅ **Continua a funzionare** normalmente

Il fallback mantiene tutte le funzionalità API:
- Lettura/scrittura elementi
- Statistiche
- Operazioni CRUD complete

## 🛠️ Integrazione con Node.js

Per integrare con il tuo server Node.js esistente:

```javascript
// Nel tuo server Node.js
app.use('/api/php-queue', proxy('http://localhost/redis_queue_manager.php'));

// Oppure fetch diretto
const response = await fetch('http://localhost/redis_queue_manager.php');
const data = await response.json();
```

## 🐛 Troubleshooting

### Redis non si connette
```bash
# Verifica se Redis è in esecuzione
redis-cli ping
# Should return: PONG

# Avvia Redis se necessario
redis-server
# oppure con Docker:
docker run -d --name redis -p 6379:6379 redis:alpine
```

### Estensione PHP Redis mancante
```bash
# Verifica se l'estensione è installata
php -m | grep redis

# Se non presente, installa:
sudo apt-get install php-redis
# Riavvia web server
sudo service apache2 restart
```

### Errori CORS
Se hai problemi CORS, modifica gli headers in `redis_queue_manager.php`:
```php
header('Access-Control-Allow-Origin: http://localhost:3030');
```

## 📊 Monitoraggio

Il gestore include logging automatico:
- ✅ Connessioni/disconnessioni Redis
- ✅ Operazioni sulla coda
- ✅ Errori e fallback
- ✅ Performance metrics

I log vengono scritti nel log degli errori PHP e possono essere visualizzati con:
```bash
tail -f /var/log/apache2/error.log
```

## 🔒 Sicurezza

**Nota di sicurezza:** Questo è un esempio per sviluppo. Per produzione considera:

- 🔐 Autenticazione/autorizzazione
- 🛡️ Validazione input più rigorosa  
- 🔍 Rate limiting
- 📝 Logging di sicurezza
- 🚫 Disabilitazione errori dettagliati

## 🤝 Supporto

Per problemi o domande:
1. Controlla il log errori PHP
2. Verifica la connessione Redis
3. Usa l'interface di test per diagnostica
4. Controlla la configurazione CORS