<?php
/**
 * Virtual Patrol Redis Queue API
 * Gestisce la coda Redis per eventi di Virtual Patrol
 * 
 * @author VPatrol System
 * @version 2.0
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

class VirtualPatrolRedisQueue {
    private $redis;
    private $isConnected;
    private $eventQueues;
    
    public function __construct() {
        $this->isConnected = false;
        $this->eventQueues = [
            'vp_events_intrusion' => 'Intrusion Events',
            'vp_events_confirmed_intrusion' => 'Confirmed Intrusion Events', 
            'vp_events_camera_offline' => 'Camera Offline Events',
            'vp_events_alert' => 'Alert Events',
            'vp_events_motion' => 'Motion Detection Events'
        ];
        
        $this->connectRedis();
    }
    
    private function connectRedis() {
        try {
            $this->redis = new Redis();
            $connected = $this->redis->connect('localhost', 6379);
            
            if ($connected) {
                $this->redis->select(0);
                $this->isConnected = true;
                error_log("🟢 VPatrol Redis connected successfully");
                
                // Popola con eventi di esempio se le code sono vuote
                $this->populateExampleEvents();
            } else {
                throw new Exception("Cannot connect to Redis");
            }
        } catch (Exception $e) {
            error_log("❌ Redis connection error: " . $e->getMessage());
            $this->isConnected = false;
        }
    }
    
    /**
     * Popola le code con eventi di esempio
     */
    private function populateExampleEvents() {
        try {
            // Controlla se le code sono vuote
            $isEmpty = true;
            foreach (array_keys($this->eventQueues) as $queue) {
                if ($this->redis->lLen($queue) > 0) {
                    $isEmpty = false;
                    break;
                }
            }
            
            if (!$isEmpty) return;
            
            // Eventi di esempio
            $sampleEvents = [
                // Intrusion events
                [
                    'queue' => 'vp_events_intrusion',
                    'data' => [
                        'event_type' => 'intrusion',
                        'camera_id' => 'CAM_001',
                        'timestamp' => date('Y-m-d\TH:i:s\Z'),
                        'title' => 'Motion detected in restricted area',
                        'metadata' => [
                            'detection_count' => 3,
                            'avg_confidence' => 87.5,
                            'json_path' => '/data/detections/cam001_' . time() . '.json',
                            'image_path' => '/data/images/cam001_' . time() . '.jpg',
                            'zone' => 'Entrance A',
                            'severity' => 'medium'
                        ]
                    ]
                ],
                [
                    'queue' => 'vp_events_intrusion',
                    'data' => [
                        'event_type' => 'intrusion',
                        'camera_id' => 'CAM_003',
                        'timestamp' => date('Y-m-d\TH:i:s\Z', time() - 300),
                        'title' => 'Multiple persons detected',
                        'metadata' => [
                            'detection_count' => 5,
                            'avg_confidence' => 92.1,
                            'json_path' => '/data/detections/cam003_' . (time()-300) . '.json',
                            'image_path' => '/data/images/cam003_' . (time()-300) . '.jpg',
                            'zone' => 'Parking Lot',
                            'severity' => 'high'
                        ]
                    ]
                ],
                
                // Confirmed intrusion events
                [
                    'queue' => 'vp_events_confirmed_intrusion',
                    'data' => [
                        'event_type' => 'confirmed_intrusion',
                        'camera_id' => 'CAM_002',
                        'timestamp' => date('Y-m-d\TH:i:s\Z', time() - 600),
                        'title' => 'CONFIRMED: Unauthorized person in secure area',
                        'metadata' => [
                            'confirmation_method' => 'AI_VERIFIED',
                            'confidence' => 96.8,
                            'json_path' => '/data/confirmed/cam002_' . (time()-600) . '.json',
                            'image_path' => '/data/confirmed/cam002_' . (time()-600) . '.jpg',
                            'zone' => 'Server Room',
                            'severity' => 'critical',
                            'actions_taken' => ['alert_sent', 'security_notified']
                        ]
                    ]
                ],
                
                // Camera offline events
                [
                    'queue' => 'vp_events_camera_offline',
                    'data' => [
                        'event_type' => 'camera_offline',
                        'camera_id' => 'CAM_005',
                        'timestamp' => date('Y-m-d\TH:i:s\Z', time() - 900),
                        'title' => 'Camera connection lost',
                        'metadata' => [
                            'camera_name' => 'Side Entrance Camera',
                            'last_seen' => date('Y-m-d\TH:i:s\Z', time() - 920),
                            'error_code' => 'CONNECTION_TIMEOUT',
                            'json_path' => '/data/status/cam005_offline_' . (time()-900) . '.json',
                            'severity' => 'medium',
                            'location' => 'Building A - Side Door'
                        ]
                    ]
                ],
                
                // Motion events
                [
                    'queue' => 'vp_events_motion',
                    'data' => [
                        'event_type' => 'motion',
                        'camera_id' => 'CAM_004',
                        'timestamp' => date('Y-m-d\TH:i:s\Z', time() - 150),
                        'title' => 'Motion detected',
                        'metadata' => [
                            'motion_intensity' => 'low',
                            'duration' => 5.2,
                            'json_path' => '/data/motion/cam004_' . (time()-150) . '.json',
                            'zone' => 'Reception Area',
                            'severity' => 'low'
                        ]
                    ]
                ],
                
                // Alert events
                [
                    'queue' => 'vp_events_alert',
                    'data' => [
                        'event_type' => 'alert',
                        'camera_id' => 'CAM_001',
                        'timestamp' => date('Y-m-d\TH:i:s\Z', time() - 1200),
                        'title' => 'System alert: High activity detected',
                        'metadata' => [
                            'alert_level' => 'HIGH',
                            'trigger_count' => 8,
                            'time_window' => '5_minutes',
                            'json_path' => '/data/alerts/system_' . (time()-1200) . '.json',
                            'severity' => 'high',
                            'zones_affected' => ['Entrance A', 'Parking Lot', 'Reception']
                        ]
                    ]
                ]
            ];
            
            // Inserisci gli eventi nelle rispettive code
            foreach ($sampleEvents as $event) {
                $this->redis->rPush($event['queue'], json_encode($event['data']));
            }
            
            error_log("✅ Virtual Patrol example events populated");
            
        } catch (Exception $e) {
            error_log("Error populating example events: " . $e->getMessage());
        }
    }
    
    /**
     * Legge gli eventi da una coda specifica
     */
    public function readQueue($queueName = null, $limit = 50) {
        if (!$this->isConnected) {
            return ['error' => 'Redis not connected', 'data' => []];
        }
        
        try {
            if ($queueName) {
                // Leggi da una coda specifica
                $events = $this->redis->lRange($queueName, 0, $limit - 1);
                return $this->formatEvents($events, $queueName);
            } else {
                // Leggi da tutte le code
                $allEvents = [];
                foreach (array_keys($this->eventQueues) as $queue) {
                    $events = $this->redis->lRange($queue, 0, $limit - 1);
                    $formatted = $this->formatEvents($events, $queue);
                    $allEvents = array_merge($allEvents, $formatted);
                }
                
                // Ordina per timestamp (più recenti prima)
                usort($allEvents, function($a, $b) {
                    return strtotime($b['timestamp']) - strtotime($a['timestamp']);
                });
                
                return array_slice($allEvents, 0, $limit);
            }
        } catch (Exception $e) {
            return ['error' => $e->getMessage(), 'data' => []];
        }
    }
    
    /**
     * Formatta gli eventi per la risposta
     */
    private function formatEvents($events, $queueName) {
        $formatted = [];
        foreach ($events as $index => $eventJson) {
            try {
                $event = json_decode($eventJson, true);
                if ($event) {
                    $event['id'] = $queueName . '_' . $index . '_' . time();
                    $event['queue_name'] = $queueName;
                    $event['queue_display'] = $this->eventQueues[$queueName] ?? $queueName;
                    $event['position'] = $index + 1;
                    $formatted[] = $event;
                }
            } catch (Exception $e) {
                // Skip invalid events
                continue;
            }
        }
        return $formatted;
    }
    
    /**
     * Ottiene statistiche delle code
     */
    public function getQueueStats() {
        if (!$this->isConnected) {
            return ['error' => 'Redis not connected'];
        }
        
        try {
            $stats = [
                'total_events' => 0,
                'queues' => [],
                'by_severity' => [
                    'critical' => 0,
                    'high' => 0,
                    'medium' => 0,
                    'low' => 0
                ],
                'by_type' => [
                    'intrusion' => 0,
                    'confirmed_intrusion' => 0,
                    'camera_offline' => 0,
                    'motion' => 0,
                    'alert' => 0
                ],
                'last_updated' => date('Y-m-d H:i:s')
            ];
            
            foreach ($this->eventQueues as $queueName => $displayName) {
                $count = $this->redis->lLen($queueName);
                $stats['queues'][$queueName] = [
                    'name' => $displayName,
                    'count' => $count
                ];
                $stats['total_events'] += $count;
                
                // Conta per tipo di evento
                $eventType = str_replace('vp_events_', '', $queueName);
                if (isset($stats['by_type'][$eventType])) {
                    $stats['by_type'][$eventType] = $count;
                }
                
                // Conta per severità (analizza gli ultimi 10 eventi)
                $recentEvents = $this->redis->lRange($queueName, 0, 9);
                foreach ($recentEvents as $eventJson) {
                    $event = json_decode($eventJson, true);
                    if ($event && isset($event['metadata']['severity'])) {
                        $severity = $event['metadata']['severity'];
                        if (isset($stats['by_severity'][$severity])) {
                            $stats['by_severity'][$severity]++;
                        }
                    }
                }
            }
            
            return $stats;
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
    
    /**
     * Aggiunge un nuovo evento alla coda
     */
    public function addEvent($queueName, $eventData) {
        if (!$this->isConnected) {
            return ['success' => false, 'error' => 'Redis not connected'];
        }
        
        try {
            // Aggiunge timestamp se non presente
            if (!isset($eventData['timestamp'])) {
                $eventData['timestamp'] = date('Y-m-d\TH:i:s\Z');
            }
            
            $this->redis->rPush($queueName, json_encode($eventData));
            
            return ['success' => true, 'message' => 'Event added successfully'];
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }
    
    /**
     * Rimuove eventi vecchi (pulizia automatica)
     */
    public function cleanOldEvents($maxAge = 86400) { // 24 ore default
        if (!$this->isConnected) return false;
        
        try {
            $cutoffTime = time() - $maxAge;
            $removed = 0;
            
            foreach (array_keys($this->eventQueues) as $queueName) {
                $events = $this->redis->lRange($queueName, 0, -1);
                $this->redis->del($queueName);
                
                foreach ($events as $eventJson) {
                    $event = json_decode($eventJson, true);
                    if ($event && isset($event['timestamp'])) {
                        $eventTime = strtotime($event['timestamp']);
                        if ($eventTime > $cutoffTime) {
                            $this->redis->rPush($queueName, $eventJson);
                        } else {
                            $removed++;
                        }
                    }
                }
            }
            
            return ['removed' => $removed, 'cutoff_time' => date('Y-m-d H:i:s', $cutoffTime)];
        } catch (Exception $e) {
            return ['error' => $e->getMessage()];
        }
    }
    
    /**
     * Stato della connessione
     */
    public function getConnectionStatus() {
        return [
            'redis_connected' => $this->isConnected,
            'available_queues' => $this->eventQueues,
            'timestamp' => date('Y-m-d H:i:s')
        ];
    }
}

// Inizializza il gestore Virtual Patrol
$vpatrol = new VirtualPatrolRedisQueue();

// Gestisce le richieste HTTP
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = array_filter(explode('/', trim($path, '/')));

try {
    switch ($method) {
        case 'GET':
            $action = end($pathParts);
            
            if ($action === 'stats') {
                // GET /stats - Statistiche
                $stats = $vpatrol->getQueueStats();
                echo json_encode([
                    'success' => !isset($stats['error']),
                    'data' => $stats
                ]);
                
            } elseif ($action === 'status') {
                // GET /status - Stato connessione
                $status = $vpatrol->getConnectionStatus();
                echo json_encode([
                    'success' => true,
                    'data' => $status
                ]);
                
            } elseif (strpos($action, 'vp_events_') === 0) {
                // GET /vp_events_{type} - Eventi di un tipo specifico
                $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
                $events = $vpatrol->readQueue($action, $limit);
                
                echo json_encode([
                    'success' => !isset($events['error']),
                    'data' => $events,
                    'count' => is_array($events) ? count($events) : 0,
                    'queue' => $action
                ]);
                
            } else {
                // GET / - Tutti gli eventi
                $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
                $events = $vpatrol->readQueue(null, $limit);
                
                echo json_encode([
                    'success' => true,
                    'data' => $events,
                    'count' => count($events),
                    'message' => 'Virtual Patrol events retrieved successfully'
                ]);
            }
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (end($pathParts) === 'clean') {
                // POST /clean - Pulisci eventi vecchi
                $maxAge = isset($input['max_age']) ? (int)$input['max_age'] : 86400;
                $result = $vpatrol->cleanOldEvents($maxAge);
                
                echo json_encode([
                    'success' => !isset($result['error']),
                    'data' => $result
                ]);
                
            } else {
                // POST /{queue_name} - Aggiungi evento
                $queueName = end($pathParts);
                if (!array_key_exists($queueName, $vpatrol->getConnectionStatus()['available_queues'])) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'error' => 'Invalid queue name'
                    ]);
                    break;
                }
                
                $result = $vpatrol->addEvent($queueName, $input);
                
                if ($result['success']) {
                    echo json_encode($result);
                } else {
                    http_response_code(500);
                    echo json_encode($result);
                }
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode([
                'success' => false,
                'error' => 'Method not allowed'
            ]);
            break;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Internal server error: ' . $e->getMessage()
    ]);
}
?>