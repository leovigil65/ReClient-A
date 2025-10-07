<?php
/**
 * Redis Queue Manager PHP
 * Gestisce la coda di registrazioni tramite Redis
 * 
 * @author Sistema di Gestione Coda
 * @version 1.0
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Gestisce le richieste OPTIONS per CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

class RedisQueueManager {
    private $redis;
    private $queueName;
    private $fallbackData;
    private $useRedis;
    
    public function __construct($redisHost = 'localhost', $redisPort = 6379, $redisDb = 0, $queueName = 'registration_queue') {
        $this->queueName = $queueName;
        $this->useRedis = false;
        $this->fallbackData = [];
        
        try {
            $this->redis = new Redis();
            $connected = $this->redis->connect($redisHost, $redisPort);
            
            if ($connected) {
                $this->redis->select($redisDb);
                $this->useRedis = true;
                error_log("🟢 Connesso a Redis su {$redisHost}:{$redisPort}");
            } else {
                throw new Exception("Impossibile connettersi a Redis");
            }
        } catch (Exception $e) {
            error_log("❌ Errore connessione Redis: " . $e->getMessage());
            error_log("🔄 Utilizzo storage in-memory come fallback");
            $this->initializeFallbackData();
        }
    }
    
    /**
     * Inizializza i dati di fallback
     */
    private function initializeFallbackData() {
        $this->fallbackData = [
            [
                'nome' => 'Mario Rossi',
                'email' => 'mario.rossi@email.com',
                'dataRegistrazione' => '2025-10-07',
                'stato' => 'In attesa'
            ],
            [
                'nome' => 'Laura Bianchi',
                'email' => 'laura.bianchi@email.com',
                'dataRegistrazione' => '2025-10-06',
                'stato' => 'In elaborazione'
            ],
            [
                'nome' => 'Giuseppe Verdi',
                'email' => 'giuseppe.verdi@email.com',
                'dataRegistrazione' => '2025-10-05',
                'stato' => 'In attesa'
            ],
            [
                'nome' => 'Anna Neri',
                'email' => 'anna.neri@email.com',
                'dataRegistrazione' => '2025-10-04',
                'stato' => 'Completato'
            ],
            [
                'nome' => 'Marco Gialli',
                'email' => 'marco.gialli@email.com',
                'dataRegistrazione' => '2025-10-03',
                'stato' => 'In attesa'
            ]
        ];
        error_log("📦 Dati di fallback inizializzati");
    }
    
    /**
     * Legge tutti gli elementi dalla coda
     */
    public function readQueue() {
        try {
            if ($this->useRedis) {
                $items = $this->redis->lRange($this->queueName, 0, -1);
                $result = [];
                
                foreach ($items as $index => $item) {
                    $decoded = json_decode($item, true);
                    if ($decoded !== null) {
                        $result[] = [
                            'id' => $index + 1,
                            'position' => $index + 1,
                            ...$decoded
                        ];
                    } else {
                        $result[] = [
                            'id' => $index + 1,
                            'position' => $index + 1,
                            'data' => $item
                        ];
                    }
                }
                
                return $result;
            } else {
                $result = [];
                foreach ($this->fallbackData as $index => $item) {
                    $result[] = [
                        'id' => $index + 1,
                        'position' => $index + 1,
                        ...$item
                    ];
                }
                return $result;
            }
        } catch (Exception $e) {
            error_log("Errore lettura coda: " . $e->getMessage());
            // Fallback a dati in memoria
            $result = [];
            foreach ($this->fallbackData as $index => $item) {
                $result[] = [
                    'id' => $index + 1,
                    'position' => $index + 1,
                    ...$item
                ];
            }
            return $result;
        }
    }
    
    /**
     * Aggiunge un elemento alla coda
     */
    public function addToQueue($item) {
        try {
            if ($this->useRedis) {
                $jsonItem = json_encode($item);
                $this->redis->rPush($this->queueName, $jsonItem);
                return true;
            } else {
                $this->fallbackData[] = $item;
                return true;
            }
        } catch (Exception $e) {
            error_log("Errore aggiunta coda: " . $e->getMessage());
            // Fallback a memoria
            $this->fallbackData[] = $item;
            return true;
        }
    }
    
    /**
     * Rimuove un elemento dalla coda per posizione
     */
    public function removeFromQueue($position) {
        try {
            if ($this->useRedis) {
                $items = $this->redis->lRange($this->queueName, 0, -1);
                $this->redis->del($this->queueName);
                
                foreach ($items as $index => $item) {
                    if ($index !== $position - 1) {
                        $this->redis->rPush($this->queueName, $item);
                    }
                }
                return true;
            } else {
                if ($position > 0 && $position <= count($this->fallbackData)) {
                    array_splice($this->fallbackData, $position - 1, 1);
                    return true;
                }
                return false;
            }
        } catch (Exception $e) {
            error_log("Errore rimozione coda: " . $e->getMessage());
            // Fallback a memoria
            if ($position > 0 && $position <= count($this->fallbackData)) {
                array_splice($this->fallbackData, $position - 1, 1);
                return true;
            }
            return false;
        }
    }
    
    /**
     * Aggiorna lo stato di un elemento nella coda
     */
    public function updateQueueItem($position, $newData) {
        try {
            if ($this->useRedis) {
                $items = $this->redis->lRange($this->queueName, 0, -1);
                
                if ($position > 0 && $position <= count($items)) {
                    $item = json_decode($items[$position - 1], true);
                    if ($item !== null) {
                        $updatedItem = array_merge($item, $newData);
                        $this->redis->lSet($this->queueName, $position - 1, json_encode($updatedItem));
                        return true;
                    }
                }
                return false;
            } else {
                if ($position > 0 && $position <= count($this->fallbackData)) {
                    $this->fallbackData[$position - 1] = array_merge($this->fallbackData[$position - 1], $newData);
                    return true;
                }
                return false;
            }
        } catch (Exception $e) {
            error_log("Errore aggiornamento coda: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Pulisce completamente la coda
     */
    public function clearQueue() {
        try {
            if ($this->useRedis) {
                $this->redis->del($this->queueName);
                return true;
            } else {
                $this->fallbackData = [];
                return true;
            }
        } catch (Exception $e) {
            error_log("Errore pulizia coda: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Ottiene statistiche della coda
     */
    public function getQueueStats() {
        $queue = $this->readQueue();
        $stats = [
            'total' => count($queue),
            'inAttesa' => 0,
            'inElaborazione' => 0,
            'completato' => 0,
            'storage' => $this->useRedis ? 'redis' : 'in-memory'
        ];
        
        foreach ($queue as $item) {
            $stato = $item['stato'] ?? 'unknown';
            switch (strtolower($stato)) {
                case 'in attesa':
                    $stats['inAttesa']++;
                    break;
                case 'in elaborazione':
                    $stats['inElaborazione']++;
                    break;
                case 'completato':
                    $stats['completato']++;
                    break;
            }
        }
        
        return $stats;
    }
    
    /**
     * Popola la coda con dati di esempio
     */
    public function populateQueue() {
        try {
            if ($this->useRedis) {
                // Svuota la coda esistente
                $this->redis->del($this->queueName);
                
                // Aggiunge i dati di esempio
                foreach ($this->fallbackData as $item) {
                    $this->redis->rPush($this->queueName, json_encode($item));
                }
                
                error_log("✅ Coda Redis popolata con dati di esempio");
                return true;
            } else {
                error_log("✅ Dati di esempio già disponibili in modalità fallback");
                return true;
            }
        } catch (Exception $e) {
            error_log("Errore popolamento coda: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Verifica lo stato della connessione Redis
     */
    public function getConnectionStatus() {
        return [
            'redis_connected' => $this->useRedis,
            'storage_type' => $this->useRedis ? 'redis' : 'in-memory',
            'queue_name' => $this->queueName,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
}

// Inizializza il gestore della coda
$queueManager = new RedisQueueManager();

// Gestisce le richieste HTTP
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

try {
    switch ($method) {
        case 'GET':
            if (end($pathParts) === 'stats') {
                // GET /stats - Statistiche della coda
                $stats = $queueManager->getQueueStats();
                echo json_encode([
                    'success' => true,
                    'data' => $stats
                ]);
            } elseif (end($pathParts) === 'status') {
                // GET /status - Stato della connessione
                $status = $queueManager->getConnectionStatus();
                echo json_encode([
                    'success' => true,
                    'data' => $status
                ]);
            } else {
                // GET / - Leggi tutta la coda
                $queue = $queueManager->readQueue();
                echo json_encode([
                    'success' => true,
                    'data' => $queue,
                    'count' => count($queue),
                    'source' => $queueManager->getConnectionStatus()['storage_type']
                ]);
            }
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (end($pathParts) === 'populate') {
                // POST /populate - Popola con dati di esempio
                $result = $queueManager->populateQueue();
                echo json_encode([
                    'success' => $result,
                    'message' => $result ? 'Coda popolata con successo' : 'Errore nel popolamento della coda'
                ]);
            } else {
                // POST / - Aggiungi elemento alla coda
                if (!isset($input['nome']) || !isset($input['email'])) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Nome ed email sono obbligatori'
                    ]);
                    break;
                }
                
                $newItem = [
                    'nome' => $input['nome'],
                    'email' => $input['email'],
                    'dataRegistrazione' => date('Y-m-d'),
                    'stato' => $input['stato'] ?? 'In attesa'
                ];
                
                $result = $queueManager->addToQueue($newItem);
                
                if ($result) {
                    echo json_encode([
                        'success' => true,
                        'message' => 'Elemento aggiunto alla coda',
                        'data' => $newItem,
                        'source' => $queueManager->getConnectionStatus()['storage_type']
                    ]);
                } else {
                    http_response_code(500);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Errore nell\'aggiunta dell\'elemento'
                    ]);
                }
            }
            break;
            
        case 'PUT':
            $input = json_decode(file_get_contents('php://input'), true);
            $position = intval(end($pathParts));
            
            if ($position > 0) {
                // PUT /{position} - Aggiorna elemento
                $result = $queueManager->updateQueueItem($position, $input);
                
                if ($result) {
                    echo json_encode([
                        'success' => true,
                        'message' => 'Elemento aggiornato con successo',
                        'source' => $queueManager->getConnectionStatus()['storage_type']
                    ]);
                } else {
                    http_response_code(404);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Posizione non valida o errore nell\'aggiornamento'
                    ]);
                }
            } else {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Posizione non valida'
                ]);
            }
            break;
            
        case 'DELETE':
            $position = intval(end($pathParts));
            
            if ($position > 0) {
                // DELETE /{position} - Rimuovi elemento
                $result = $queueManager->removeFromQueue($position);
                
                if ($result) {
                    echo json_encode([
                        'success' => true,
                        'message' => 'Elemento rimosso dalla coda',
                        'source' => $queueManager->getConnectionStatus()['storage_type']
                    ]);
                } else {
                    http_response_code(404);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Posizione non valida'
                    ]);
                }
            } elseif (end($pathParts) === 'clear') {
                // DELETE /clear - Pulisci tutta la coda
                $result = $queueManager->clearQueue();
                
                echo json_encode([
                    'success' => $result,
                    'message' => $result ? 'Coda pulita con successo' : 'Errore nella pulizia della coda'
                ]);
            } else {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error' => 'Posizione non valida'
                ]);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode([
                'success' => false,
                'error' => 'Metodo non supportato'
            ]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Errore interno del server: ' . $e->getMessage()
    ]);
}
?>