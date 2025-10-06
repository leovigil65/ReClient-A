import React, { useState, useEffect } from 'react';
import redisQueueService from '../services/redisQueueService';

const Features = () => {
  const [queueData, setQueueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [newItem, setNewItem] = useState({ nome: '', email: '' });

  const features = [
    {
      icon: '⚡',
      title: 'Fast and Efficient',
      description: 'Built with React for maximum performance and smooth user experience.'
    },
    {
      icon: '📱',
      title: 'Responsive',
      description: 'Fully adaptive design that works perfectly on all devices.'
    },
    {
      icon: '🎨',
      title: 'Modern Design',
      description: 'Elegant and clean interface with the best UI/UX design practices.'
    },
    {
      icon: '🔒',
      title: 'Secure',
      description: 'Implemented with security best practices to protect your data.'
    },
    {
      icon: '⚙️',
      title: 'Configurable',
      description: 'Highly customizable to adapt to your specific needs.'
    },
    {
      icon: '🚀',
      title: 'Scalable',
      description: 'Robust architecture that grows with your business and future needs.'
    }
  ];

  useEffect(() => {
    // Carica i dati iniziali
    loadQueueData();

    // Configura WebSocket per aggiornamenti in tempo reale
    redisQueueService.connectWebSocket();
    
    const unsubscribe = redisQueueService.addListener((data) => {
      if (data.type === 'queue_data') {
        setQueueData(data.data);
        setIsConnected(true);
        setLoading(false);
      } else if (data.type === 'queue_updated') {
        loadQueueData(); // Ricarica i dati quando la coda viene aggiornata
      }
    });

    return () => {
      unsubscribe();
      redisQueueService.disconnect();
    };
  }, []);

  const loadQueueData = async () => {
    try {
      setLoading(true);
      const data = await redisQueueService.getQueueData();
      setQueueData(data);
      setIsConnected(true);
      setError(null);
    } catch (err) {
      setError('Errore nel caricamento dei dati dalla coda Redis');
      setIsConnected(false);
      console.error('Errore caricamento:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    
    if (!newItem.nome || !newItem.email) {
      alert('Nome ed email sono obbligatori');
      return;
    }

    try {
      await redisQueueService.addToQueue(newItem);
      setNewItem({ nome: '', email: '' });
      // I dati si aggiorneranno automaticamente via WebSocket
    } catch (err) {
      alert('Errore nell\'aggiunta dell\'elemento: ' + err.message);
    }
  };

  const handleRemoveItem = async (position) => {
    try {
      await redisQueueService.removeFromQueue(position);
      // I dati si aggiorneranno automaticamente via WebSocket
    } catch (err) {
      alert('Errore nella rimozione dell\'elemento: ' + err.message);
    }
  };

  const getStatusClass = (stato) => {
    switch (stato?.toLowerCase()) {
      case 'in attesa':
        return 'status-waiting';
      case 'in elaborazione':
        return 'status-processing';
      case 'completato':
        return 'status-completed';
      default:
        return 'status-default';
    }
  };

  return (
    <section className="features" id="features">
      <div className="container">
        <h2>Key Features</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Coda Redis */}
        <div className="redis-queue-section">
          <div className="queue-header">
            <h2>Coda Redis</h2>
            <div className="connection-status">
              <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
                {isConnected ? '🟢 Connesso' : '🔴 Disconnesso'}
              </span>
              <button onClick={loadQueueData} className="refresh-btn">
                🔄 Aggiorna
              </button>
            </div>
          </div>

          {/* Form per aggiungere elementi */}
          <div className="add-item-form">
            <h3>Aggiungi alla Coda</h3>
            <form onSubmit={handleAddItem}>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Nome"
                  value={newItem.nome}
                  onChange={(e) => setNewItem({...newItem, nome: e.target.value})}
                  className="form-input"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newItem.email}
                  onChange={(e) => setNewItem({...newItem, email: e.target.value})}
                  className="form-input"
                />
                <button type="submit" className="add-btn">Aggiungi</button>
              </div>
            </form>
          </div>

          {/* Tabella della coda */}
          <div className="queue-table-container">
            {loading ? (
              <div className="loading">Caricamento dati dalla coda Redis...</div>
            ) : error ? (
              <div className="error">{error}</div>
            ) : (
              <table className="queue-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Data Registrazione</th>
                    <th>Posizione</th>
                    <th>Stato</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {queueData.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="no-data">
                        Nessun elemento nella coda
                      </td>
                    </tr>
                  ) : (
                    queueData.map((item) => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>{item.nome}</td>
                        <td>{item.email}</td>
                        <td>{item.dataRegistrazione}</td>
                        <td>{item.position}</td>
                        <td>
                          <span className={`status ${getStatusClass(item.stato)}`}>
                            {item.stato}
                          </span>
                        </td>
                        <td>
                          <button 
                            onClick={() => handleRemoveItem(item.position)}
                            className="remove-btn"
                            title="Rimuovi dalla coda"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
          
          <div className="queue-info">
            <p>
              <strong>URL Redis:</strong> redis://redis:6379/0 <br/>
              <strong>Elementi in coda:</strong> {queueData.length} <br/>
              <strong>Ultimo aggiornamento:</strong> {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;