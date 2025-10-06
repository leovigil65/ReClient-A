const express = require('express');
const cors = require('cors');
const redis = require('redis');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Configurazione Redis
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379/0'
});

// Fallback in-memory storage
let inMemoryQueue = [];
let useRedis = false;

// Gestione errori Redis
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err.message);
  useRedis = false;
  console.log('🔴 Fallback a storage in-memory');
});

redisClient.on('connect', () => {
  console.log('🟢 Connesso a Redis');
  useRedis = true;
});

// Connessione a Redis con fallback
async function connectRedis() {
  try {
    await redisClient.connect();
    console.log('Redis client connesso con successo');
    useRedis = true;
  } catch (error) {
    console.error('❌ Errore connessione Redis:', error.message);
    console.log('🔄 Utilizzo storage in-memory come fallback');
    useRedis = false;
    await initializeFallbackData();
  }
}

// Inizializza dati di fallback
async function initializeFallbackData() {
  inMemoryQueue = [
    {
      nome: 'Mario Rossi',
      email: 'mario.rossi@email.com',
      dataRegistrazione: '2025-10-01',
      stato: 'In attesa'
    },
    {
      nome: 'Laura Bianchi',
      email: 'laura.bianchi@email.com',
      dataRegistrazione: '2025-10-02',
      stato: 'In elaborazione'
    },
    {
      nome: 'Giuseppe Verdi',
      email: 'giuseppe.verdi@email.com',
      dataRegistrazione: '2025-10-03',
      stato: 'In attesa'
    },
    {
      nome: 'Anna Neri',
      email: 'anna.neri@email.com',
      dataRegistrazione: '2025-10-04',
      stato: 'Completato'
    },
    {
      nome: 'Marco Gialli',
      email: 'marco.gialli@email.com',
      dataRegistrazione: '2025-10-05',
      stato: 'In attesa'
    }
  ];
  console.log('📦 Dati di fallback inizializzati');
}

// Funzione per leggere dalla coda (Redis o fallback)
async function readFromQueue(queueName = 'registration_queue') {
  try {
    if (useRedis) {
      // Legge da Redis
      const items = await redisClient.lRange(queueName, 0, -1);
      return items.map((item, index) => {
        try {
          const parsed = JSON.parse(item);
          return {
            id: index + 1,
            ...parsed,
            position: index + 1
          };
        } catch (e) {
          return {
            id: index + 1,
            data: item,
            position: index + 1
          };
        }
      });
    } else {
      // Usa fallback in-memory
      return inMemoryQueue.map((item, index) => ({
        id: index + 1,
        ...item,
        position: index + 1
      }));
    }
  } catch (error) {
    console.error('Errore lettura coda:', error);
    return inMemoryQueue.map((item, index) => ({
      id: index + 1,
      ...item,
      position: index + 1
    }));
  }
}

// Funzione per aggiungere alla coda
async function addToQueue(item, queueName = 'registration_queue') {
  try {
    if (useRedis) {
      await redisClient.rPush(queueName, JSON.stringify(item));
    } else {
      inMemoryQueue.push(item);
    }
  } catch (error) {
    console.error('Errore aggiunta coda:', error);
    // Fallback a in-memory anche in caso di errore Redis
    inMemoryQueue.push(item);
  }
}

// Funzione per rimuovere dalla coda
async function removeFromQueue(position, queueName = 'registration_queue') {
  try {
    if (useRedis) {
      const items = await redisClient.lRange(queueName, 0, -1);
      await redisClient.del(queueName);
      
      for (let i = 0; i < items.length; i++) {
        if (i !== position - 1) {
          await redisClient.rPush(queueName, items[i]);
        }
      }
    } else {
      if (position > 0 && position <= inMemoryQueue.length) {
        inMemoryQueue.splice(position - 1, 1);
      }
    }
  } catch (error) {
    console.error('Errore rimozione coda:', error);
    // Fallback a in-memory
    if (position > 0 && position <= inMemoryQueue.length) {
      inMemoryQueue.splice(position - 1, 1);
    }
  }
}

// Funzione per aggiungere dati di esempio alla coda
async function populateQueue() {
  try {
    if (useRedis) {
      const sampleData = [
        {
          nome: 'Mario Rossi',
          email: 'mario.rossi@email.com',
          dataRegistrazione: '2025-10-01',
          stato: 'In attesa'
        },
        {
          nome: 'Laura Bianchi',
          email: 'laura.bianchi@email.com',
          dataRegistrazione: '2025-10-02',
          stato: 'In elaborazione'
        },
        {
          nome: 'Giuseppe Verdi',
          email: 'giuseppe.verdi@email.com',
          dataRegistrazione: '2025-10-03',
          stato: 'In attesa'
        },
        {
          nome: 'Anna Neri',
          email: 'anna.neri@email.com',
          dataRegistrazione: '2025-10-04',
          stato: 'Completato'
        },
        {
          nome: 'Marco Gialli',
          email: 'marco.gialli@email.com',
          dataRegistrazione: '2025-10-05',
          stato: 'In attesa'
        }
      ];

      // Svuota la coda esistente
      await redisClient.del('registration_queue');
      
      // Aggiunge i dati di esempio
      for (const item of sampleData) {
        await redisClient.rPush('registration_queue', JSON.stringify(item));
      }
      
      console.log('✅ Coda Redis popolata con dati di esempio');
    } else {
      console.log('✅ Dati di esempio già disponibili in modalità fallback');
    }
  } catch (error) {
    console.error('Errore popolamento coda:', error);
    console.log('✅ Utilizzo dati fallback');
  }
}

// Routes API
app.get('/api/queue', async (req, res) => {
  try {
    const queueData = await readFromQueue();
    res.json({
      success: true,
      data: queueData,
      count: queueData.length,
      source: useRedis ? 'redis' : 'in-memory'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/queue', async (req, res) => {
  try {
    const { nome, email, stato = 'In attesa' } = req.body;
    
    if (!nome || !email) {
      return res.status(400).json({
        success: false,
        error: 'Nome ed email sono obbligatori'
      });
    }

    const newItem = {
      nome,
      email,
      dataRegistrazione: new Date().toISOString().split('T')[0],
      stato
    };

    await addToQueue(newItem);
    
    // Notifica via WebSocket
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'queue_updated',
          data: newItem
        }));
      }
    });

    res.json({
      success: true,
      message: 'Elemento aggiunto alla coda',
      data: newItem,
      source: useRedis ? 'redis' : 'in-memory'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.delete('/api/queue/:position', async (req, res) => {
  try {
    const position = parseInt(req.params.position);
    
    const queueData = await readFromQueue();
    
    if (position < 1 || position > queueData.length) {
      return res.status(404).json({
        success: false,
        error: 'Posizione non valida'
      });
    }

    await removeFromQueue(position);

    // Notifica via WebSocket
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'queue_updated',
          message: 'Elemento rimosso dalla coda'
        }));
      }
    });

    res.json({
      success: true,
      message: 'Elemento rimosso dalla coda',
      source: useRedis ? 'redis' : 'in-memory'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('Nuovo client WebSocket connesso');
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'get_queue') {
        const queueData = await readFromQueue();
        ws.send(JSON.stringify({
          type: 'queue_data',
          data: queueData
        }));
      }
      
      // Handle Virtual Patrol event subscription
      if (data.type === 'subscribe_vp_events') {
        console.log('Client subscribed to Virtual Patrol events:', data.events);
        ws.vpEventsSubscribed = true;
        ws.vpEventTypes = data.events || ['intrusion', 'confirmed_intrusion', 'camera_offline'];
        
        // Send confirmation
        ws.send(JSON.stringify({
          type: 'vp_subscription_confirmed',
          events: ws.vpEventTypes
        }));
      }
      
    } catch (error) {
      console.error('Errore WebSocket:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('Client WebSocket disconnesso');
  });
});

// Function to broadcast Virtual Patrol events to subscribed clients
function broadcastVPEvent(eventData) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client.vpEventsSubscribed) {
      // Check if client is interested in this event type
      if (!client.vpEventTypes || client.vpEventTypes.includes(eventData.event_type)) {
        client.send(JSON.stringify({
          type: 'vp_event',
          data: eventData
        }));
      }
    }
  });
}

// API endpoint to simulate Virtual Patrol events (for testing)
app.post('/api/vp-event', (req, res) => {
  try {
    const eventData = req.body;
    
    // Validate event data
    if (!eventData.event_type) {
      return res.status(400).json({
        success: false,
        error: 'event_type is required'
      });
    }
    
    // Add timestamp if not present
    if (!eventData.timestamp) {
      eventData.timestamp = new Date().toISOString();
    }
    
    // Broadcast to connected clients
    broadcastVPEvent(eventData);
    
    console.log(`📡 Broadcasting VP event: ${eventData.event_type}`);
    
    res.json({
      success: true,
      message: 'Virtual Patrol event broadcasted',
      event: eventData
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// API endpoint to get sample Virtual Patrol events
app.get('/api/vp-sample-events', (req, res) => {
  const sampleEvents = [
    {
      event_type: 'intrusion',
      camera_id: 'CAM_001',
      timestamp: new Date().toISOString(),
      metadata: {
        detection_count: 2,
        avg_confidence: 85.5,
        json_path: '/data/detections/cam001_20251006_143022.json'
      }
    },
    {
      event_type: 'confirmed_intrusion',
      camera_id: 'CAM_002',
      title: 'Confirmed human intrusion in restricted area',
      timestamp: new Date().toISOString(),
      metadata: {
        json_path: '/data/confirmed/cam002_20251006_143055.json',
        confidence: 95.2
      }
    },
    {
      event_type: 'camera_offline',
      camera_id: 'CAM_003',
      timestamp: new Date().toISOString(),
      metadata: {
        camera_name: 'Front Entrance Camera',
        json_path: '/data/status/cam003_offline_20251006_143102.json',
        last_seen: '2025-10-06T14:25:00Z'
      }
    }
  ];
  
  res.json({
    success: true,
    events: sampleEvents
  });
});

// Avvio del server
const PORT = process.env.PORT || 3030;

async function startServer() {
  await connectRedis();
  await populateQueue(); // Popola con dati di esempio
  
  server.listen(PORT, () => {
    console.log(`Server in esecuzione sulla porta ${PORT}`);
    console.log(`API disponibile su http://localhost:${PORT}/api/queue`);
  });
}

startServer().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Chiusura del server...');
  if (useRedis) {
    try {
      await redisClient.disconnect();
    } catch (error) {
      console.log('Redis già disconnesso');
    }
  }
  server.close(() => {
    console.log('Server chiuso');
    process.exit(0);
  });
});