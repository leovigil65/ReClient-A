<?php
/**
 * Configurazione Redis Queue Manager
 */

return [
    // Configurazione Redis
    'redis' => [
        'host' => 'localhost',
        'port' => 6379,
        'database' => 0,
        'timeout' => 2.5,
        'retry_interval' => 100,
        'read_timeout' => -1
    ],
    
    // Configurazione Coda
    'queue' => [
        'name' => 'registration_queue',
        'max_items' => 1000,
        'auto_populate' => true
    ],
    
    // Configurazione CORS
    'cors' => [
        'allowed_origins' => ['*'],
        'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        'allowed_headers' => ['Content-Type', 'Authorization']
    ],
    
    // Configurazione Logging
    'logging' => [
        'enabled' => true,
        'level' => 'INFO', // DEBUG, INFO, WARNING, ERROR
        'file' => 'logs/redis_queue.log'
    ],
    
    // Dati di esempio per fallback
    'sample_data' => [
        [
            'nome' => 'Mario Rossi',
            'email' => 'mario.rossi@email.com',
            'dataRegistrazione' => '2025-10-07',
            'stato' => 'In attesa',
            'telefono' => '+39 123 456 7890',
            'servizio' => 'Consulenza tecnica'
        ],
        [
            'nome' => 'Laura Bianchi',
            'email' => 'laura.bianchi@email.com',
            'dataRegistrazione' => '2025-10-06',
            'stato' => 'In elaborazione',
            'telefono' => '+39 098 765 4321',
            'servizio' => 'Supporto software'
        ],
        [
            'nome' => 'Giuseppe Verdi',
            'email' => 'giuseppe.verdi@email.com',
            'dataRegistrazione' => '2025-10-05',
            'stato' => 'In attesa',
            'telefono' => '+39 555 123 456',
            'servizio' => 'Installazione sistema'
        ],
        [
            'nome' => 'Anna Neri',
            'email' => 'anna.neri@email.com',
            'dataRegistrazione' => '2025-10-04',
            'stato' => 'Completato',
            'telefono' => '+39 777 888 999',
            'servizio' => 'Manutenzione'
        ],
        [
            'nome' => 'Marco Gialli',
            'email' => 'marco.gialli@email.com',
            'dataRegistrazione' => '2025-10-03',
            'stato' => 'In attesa',
            'telefono' => '+39 333 222 111',
            'servizio' => 'Formazione utenti'
        ]
    ]
];
?>