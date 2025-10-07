import React, { useState, useEffect, useCallback } from 'react';
import './VirtualPatrolListener.css';

const VirtualPatrolRedisClient = () => {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedQueue, setSelectedQueue] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(null);

  const API_BASE = '/vpatrol_redis_api.php';

  // Available queues
  const queues = {
    'all': 'All Events',
    'vp_events_intrusion': 'Intrusion Events',
    'vp_events_confirmed_intrusion': 'Confirmed Intrusions',
    'vp_events_camera_offline': 'Camera Offline',
    'vp_events_motion': 'Motion Detection',
    'vp_events_alert': 'System Alerts'
  };

  // Check connection status
  const checkConnectionStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/status`);
      const data = await response.json();
      
      if (data.success && data.data.redis_connected) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      console.error('Connection check failed:', error);
      setConnectionStatus('error');
    }
  }, []);

  // Load events from Redis queue
  const loadEvents = useCallback(async (queueName = 'all', showLoading = true) => {
    if (showLoading) setIsLoading(true);
    
    try {
      const endpoint = queueName === 'all' ? API_BASE : `${API_BASE}/${queueName}`;
      const response = await fetch(`${endpoint}?limit=100`);
      const data = await response.json();
      
      if (data.success) {
        setEvents(data.data || []);
      } else {
        console.error('Failed to load events:', data);
        setEvents([]);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents([]);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, []);

  // Load statistics
  const loadStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/stats`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      } else {
        console.error('Failed to load stats:', data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, []);

  // Clean old events
  const cleanOldEvents = async () => {
    if (!window.confirm('Remove events older than 24 hours?')) return;
    
    try {
      const response = await fetch(`${API_BASE}/clean`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ max_age: 86400 }) // 24 hours
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Removed ${data.data.removed} old events`);
        loadEvents(selectedQueue);
        loadStats();
      } else {
        alert('Failed to clean events: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error cleaning events:', error);
      alert('Error cleaning events');
    }
  };

  // Simulate adding a test event
  const addTestEvent = async () => {
    const eventTypes = ['intrusion', 'confirmed_intrusion', 'camera_offline', 'motion', 'alert'];
    const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const queueName = `vp_events_${randomType}`;
    
    const testEvent = {
      event_type: randomType,
      camera_id: `CAM_${Math.floor(Math.random() * 10).toString().padStart(3, '0')}`,
      title: `Test ${randomType} event`,
      timestamp: new Date().toISOString(),
      metadata: {
        severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
        json_path: `/data/test/test_${Date.now()}.json`,
        test_event: true
      }
    };
    
    try {
      const response = await fetch(`${API_BASE}/${queueName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testEvent)
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('Test event added successfully');
        loadEvents(selectedQueue);
        loadStats();
      } else {
        console.error('Failed to add test event:', data.error);
      }
    } catch (error) {
      console.error('Error adding test event:', error);
    }
  };

  // Get event icon based on type
  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'intrusion': return '🚨';
      case 'confirmed_intrusion': return '⚠️';
      case 'camera_offline': return '📴';
      case 'motion': return '👁️';
      case 'alert': return '🔔';
      default: return '📋';
    }
  };

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return '#d32f2f';
      case 'high': return '#f57c00';
      case 'medium': return '#1976d2';
      case 'low': return '#388e3c';
      default: return '#757575';
    }
  };

  // Handle queue selection
  const handleQueueChange = (queueName) => {
    setSelectedQueue(queueName);
    loadEvents(queueName);
  };

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadEvents(selectedQueue, false);
        loadStats();
      }, 5000); // Refresh every 5 seconds
      
      setRefreshInterval(interval);
      
      return () => clearInterval(interval);
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
  }, [autoRefresh, selectedQueue, loadEvents, loadStats, refreshInterval]);

  // Initial load
  useEffect(() => {
    checkConnectionStatus();
    loadEvents();
    loadStats();
  }, [checkConnectionStatus, loadEvents, loadStats]);

  return (
    <div className="vpatrol-redis-client">
      <div className="vp-header">
        <h2>🛡️ Virtual Patrol Redis Queue Client</h2>
        <div className={`connection-status ${connectionStatus}`}>
          <span className="status-indicator"></span>
          <span className="status-text">
            {connectionStatus === 'connected' ? 'Redis Connected' : 
             connectionStatus === 'error' ? 'Connection Error' : 'Redis Disconnected'}
          </span>
        </div>
      </div>

      {/* Statistics Section */}
      {stats && (
        <div className="stats-section">
          <h3>📊 Queue Statistics</h3>
          <div className="stats-grid">
            <div className="stat-card total">
              <div className="stat-number">{stats.total_events}</div>
              <div className="stat-label">Total Events</div>
            </div>
            <div className="stat-card critical">
              <div className="stat-number">{stats.by_severity?.critical || 0}</div>
              <div className="stat-label">Critical</div>
            </div>
            <div className="stat-card high">
              <div className="stat-number">{stats.by_severity?.high || 0}</div>
              <div className="stat-label">High</div>
            </div>
            <div className="stat-card medium">
              <div className="stat-number">{stats.by_severity?.medium || 0}</div>
              <div className="stat-label">Medium</div>
            </div>
            <div className="stat-card low">
              <div className="stat-number">{stats.by_severity?.low || 0}</div>
              <div className="stat-label">Low</div>
            </div>
          </div>

          <div className="queue-stats">
            <h4>Events by Queue:</h4>
            <div className="queue-list">
              {stats.queues && Object.entries(stats.queues).map(([queueName, queueData]) => (
                <div key={queueName} className="queue-stat">
                  <span className="queue-name">{queueData.name}</span>
                  <span className="queue-count">{queueData.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Controls Section */}
      <div className="controls-section">
        <div className="control-group">
          <label>Queue Filter:</label>
          <select 
            value={selectedQueue} 
            onChange={(e) => handleQueueChange(e.target.value)}
            className="queue-selector"
          >
            {Object.entries(queues).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto Refresh (5s)
          </label>
        </div>

        <div className="action-buttons">
          <button 
            onClick={() => {checkConnectionStatus(); loadEvents(selectedQueue); loadStats();}}
            className="btn refresh-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
          
          <button 
            onClick={addTestEvent}
            className="btn test-btn"
          >
            Add Test Event
          </button>
          
          <button 
            onClick={cleanOldEvents}
            className="btn clean-btn"
          >
            Clean Old Events
          </button>
        </div>
      </div>

      {/* Events Section */}
      <div className="events-section">
        <h3>
          📋 Events 
          {selectedQueue !== 'all' && ` - ${queues[selectedQueue]}`}
          <span className="event-count">({events.length})</span>
        </h3>

        {isLoading ? (
          <div className="loading-spinner">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="no-events">
            <p>No events found in the selected queue.</p>
          </div>
        ) : (
          <div className="events-list">
            {events.map((event, index) => (
              <div 
                key={event.id || index} 
                className="event-item"
                style={{ 
                  borderLeftColor: getSeverityColor(event.metadata?.severity || 'medium') 
                }}
              >
                <div className="event-header">
                  <span className="event-icon">{getEventIcon(event.event_type)}</span>
                  <div className="event-title-section">
                    <span className="event-type">{event.event_type?.replace('_', ' ')}</span>
                    <span className="event-title">{event.title}</span>
                  </div>
                  <div className="event-meta">
                    <span className="event-time">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                    {event.queue_display && (
                      <span className="event-queue">{event.queue_display}</span>
                    )}
                  </div>
                </div>

                <div className="event-details">
                  {event.camera_id && (
                    <div className="detail-item">
                      <strong>Camera:</strong> {event.camera_id}
                    </div>
                  )}

                  {event.metadata && (
                    <div className="metadata-section">
                      <strong>Metadata:</strong>
                      <div className="metadata-grid">
                        {event.metadata.severity && (
                          <span 
                            className="metadata-badge severity"
                            style={{ backgroundColor: getSeverityColor(event.metadata.severity) }}
                          >
                            {event.metadata.severity.toUpperCase()}
                          </span>
                        )}
                        {event.metadata.detection_count && (
                          <span className="metadata-badge">
                            Detections: {event.metadata.detection_count}
                          </span>
                        )}
                        {event.metadata.avg_confidence && (
                          <span className="metadata-badge">
                            Confidence: {event.metadata.avg_confidence}%
                          </span>
                        )}
                        {event.metadata.zone && (
                          <span className="metadata-badge">
                            Zone: {event.metadata.zone}
                          </span>
                        )}
                        {event.metadata.camera_name && (
                          <span className="metadata-badge">
                            {event.metadata.camera_name}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="event-raw">
                  <details>
                    <summary>Raw Event Data</summary>
                    <pre>{JSON.stringify(event, null, 2)}</pre>
                  </details>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VirtualPatrolRedisClient;