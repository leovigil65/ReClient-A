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
  url: 'redis://redis:6379/0'
});

// Gestione errori Redis
redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('Connesso a Redis');
});

// Connessione a Redis
async function connectRedis() {
  try {
    await redisClient.connect();
    console.log('Redis client connesso con successo');
  } catch (error) {
    console.error('Errore connessione Redis:', error);
  }
}

// Funzione per leggere dalla coda Redis
async function readFromQueue(queueName = 'registration_queue') {
  try {
    // Legge elementi dalla lista Redis (coda)
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
  } catch (error) {
    console.error('Errore lettura coda:', error);
    return [];
  }
}

// Funzione per aggiungere dati di esempio alla coda
async function populateQueue() {
  try {
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
    
    console.log('Coda popolata con dati di esempio');
  } catch (error) {
    console.error('Errore popolamento coda:', error);
  }
}

// Routes API
app.get('/api/queue', async (req, res) => {
  try {
    const queueData = await readFromQueue();
    res.json({
      success: true,
      data: queueData,
      count: queueData.length
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

    await redisClient.rPush('registration_queue', JSON.stringify(newItem));
    
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
      data: newItem
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
    const position = parseInt(req.params.position) - 1;
    
    // Rimuove elemento dalla posizione specificata
    const items = await redisClient.lRange('registration_queue', 0, -1);
    
    if (position < 0 || position >= items.length) {
      return res.status(404).json({
        success: false,
        error: 'Posizione non valida'
      });
    }

    // Ricostruisce la coda senza l'elemento specificato
    await redisClient.del('registration_queue');
    
    for (let i = 0; i < items.length; i++) {
      if (i !== position) {
        await redisClient.rPush('registration_queue', items[i]);
      }
    }

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
      message: 'Elemento rimosso dalla coda'
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
    } catch (error) {
      console.error('Errore WebSocket:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('Client WebSocket disconnesso');
  });
});

// Avvio del server
const PORT = process.env.PORT || 3001;

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
  await redisClient.disconnect();
  server.close(() => {
    console.log('Server chiuso');
    process.exit(0);
  });
});