import React, { useState, useEffect, useCallback } from 'react';
import VPEventSimulator from './VPEventSimulator';
import './VirtualPatrolListener.css';

const VirtualPatrolListener = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState([]);
  const [wsConnection, setWsConnection] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Handle different types of Virtual Patrol events
  const handleEvent = useCallback((eventData) => {
    try {
      const event = typeof eventData === 'string' ? JSON.parse(eventData) : eventData;
      const eventType = event.event_type;
      
      console.log(`📩 Received event: ${eventType}`, event);
      
      // Add timestamp to event
      const timestampedEvent = {
        ...event,
        receivedAt: new Date().toISOString(),
        id: Date.now() + Math.random()
      };
      
      // Add to events list (keep last 50 events)
      setEvents(prevEvents => [timestampedEvent, ...prevEvents.slice(0, 49)]);
      
      // Process based on event type
      switch (eventType) {
        case 'intrusion':
          handleIntrusion(event);
          break;
        case 'confirmed_intrusion':
          handleConfirmedIntrusion(event);
          break;
        case 'camera_offline':
          handleCameraOffline(event);
          break;
        default:
          console.log(`📋 Unknown event type: ${eventType}`);
      }
    } catch (error) {
      console.error('❌ Error processing event:', error);
    }
  }, []);

  const handleIntrusion = (eventData) => {
    const metadata = eventData.metadata || {};
    const cameraId = eventData.camera_id;
    
    // Access metadata fields
    const imagePath = metadata.json_path?.replace('json', 'jpg');
    const detectionCount = metadata.detection_count || 0;
    const confidence = metadata.avg_confidence || 0;
    
    console.log('🚨 Intrusion detected!');
    console.log(`   Camera: ${cameraId}`);
    console.log(`   Detections: ${detectionCount}`);
    console.log(`   Confidence: ${confidence}`);
    console.log(`   Image: ${imagePath}`);
    
    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification('🚨 Intrusion Detected!', {
        body: `Camera ${cameraId}: ${detectionCount} detections (${confidence}% confidence)`,
        icon: '/favicon.ico'
      });
    }
  };

  const handleConfirmedIntrusion = (eventData) => {
    const metadata = eventData.metadata || {};
    console.log(`⚠️ CONFIRMED INTRUSION: ${eventData.title}, ${metadata.json_path}`);
    
    // Show high priority notification
    if (Notification.permission === 'granted') {
      new Notification('⚠️ CONFIRMED INTRUSION!', {
        body: `Title: ${eventData.title}`,
        icon: '/favicon.ico',
        requireInteraction: true
      });
    }
  };

  const handleCameraOffline = (eventData) => {
    const metadata = eventData.metadata || {};
    const jsonPath = metadata.json_path;
    const cameraName = metadata.camera_name;
    
    console.log(`📴 Camera offline: ${cameraName}`);
    console.log(`   Metadata: ${jsonPath}`);
    
    if (Notification.permission === 'granted') {
      new Notification('📴 Camera Offline', {
        body: `Camera ${cameraName} is offline`,
        icon: '/favicon.ico'
      });
    }
  };

  // Connect to WebSocket
  const connectWebSocket = useCallback(() => {
    const wsUrl = `ws://localhost:3030`;
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('🎧 Connected to Virtual Patrol events via WebSocket');
      setIsConnected(true);
      setConnectionStatus('connected');
      setWsConnection(ws);
      
      // Send subscription message for Virtual Patrol events
      ws.send(JSON.stringify({
        type: 'subscribe_vp_events',
        events: ['intrusion', 'confirmed_intrusion', 'camera_offline']
      }));
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle Virtual Patrol events
        if (data.type === 'vp_event') {
          handleEvent(data.data);
        }
        // Handle other WebSocket messages (like queue updates)
        else if (data.type === 'queue_updated') {
          // Handle queue updates if needed
          console.log('Queue updated:', data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onclose = () => {
      console.log('WebSocket connection closed');
      setIsConnected(false);
      setConnectionStatus('disconnected');
      setWsConnection(null);
      
      // Reconnect after 5 seconds
      setTimeout(connectWebSocket, 5000);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('error');
    };
    
  }, [handleEvent]);

  // Request notification permission
  const requestNotificationPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  };

  // Connect on component mount
  useEffect(() => {
    connectWebSocket();
    requestNotificationPermission();
    
    // Cleanup on unmount
    return () => {
      if (wsConnection) {
        wsConnection.close();
      }
    };
  }, [connectWebSocket]);

  const clearEvents = () => {
    setEvents([]);
  };

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'intrusion': return '🚨';
      case 'confirmed_intrusion': return '⚠️';
      case 'camera_offline': return '📴';
      default: return '📋';
    }
  };

  const getEventColor = (eventType) => {
    switch (eventType) {
      case 'intrusion': return '#ff9800';
      case 'confirmed_intrusion': return '#f44336';
      case 'camera_offline': return '#9e9e9e';
      default: return '#2196f3';
    }
  };

  return (
    <div className="virtual-patrol-listener">
      <div className="vp-header">
        <h2>🛡️ Virtual Patrol Event Listener</h2>
        <div className={`connection-status ${connectionStatus}`}>
          <span className="status-indicator"></span>
          <span className="status-text">
            {connectionStatus === 'connected' ? 'Connected' : 
             connectionStatus === 'error' ? 'Error' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="vp-controls">
        <button 
          onClick={connectWebSocket} 
          disabled={isConnected}
          className="connect-btn"
        >
          {isConnected ? 'Connected' : 'Reconnect'}
        </button>
        <button 
          onClick={clearEvents}
          className="clear-btn"
        >
          Clear Events ({events.length})
        </button>
        <button 
          onClick={requestNotificationPermission}
          className="notification-btn"
        >
          Enable Notifications
        </button>
      </div>

      <VPEventSimulator />

      <div className="events-container">
        <h3>Recent Events ({events.length})</h3>
        {events.length === 0 ? (
          <div className="no-events">
            <p>No events received yet. Listening for Virtual Patrol events...</p>
          </div>
        ) : (
          <div className="events-list">
            {events.map((event) => (
              <div 
                key={event.id} 
                className="event-item"
                style={{ borderLeftColor: getEventColor(event.event_type) }}
              >
                <div className="event-header">
                  <span className="event-icon">{getEventIcon(event.event_type)}</span>
                  <span className="event-type">{event.event_type}</span>
                  <span className="event-time">
                    {new Date(event.receivedAt).toLocaleTimeString()}
                  </span>
                </div>
                
                <div className="event-details">
                  {event.camera_id && (
                    <div className="detail-item">
                      <strong>Camera:</strong> {event.camera_id}
                    </div>
                  )}
                  
                  {event.title && (
                    <div className="detail-item">
                      <strong>Title:</strong> {event.title}
                    </div>
                  )}
                  
                  {event.metadata && (
                    <div className="detail-item">
                      <strong>Metadata:</strong>
                      <div className="metadata-details">
                        {event.metadata.detection_count && (
                          <span>Detections: {event.metadata.detection_count}</span>
                        )}
                        {event.metadata.avg_confidence && (
                          <span>Confidence: {event.metadata.avg_confidence}%</span>
                        )}
                        {event.metadata.camera_name && (
                          <span>Camera Name: {event.metadata.camera_name}</span>
                        )}
                        {event.metadata.json_path && (
                          <span>Path: {event.metadata.json_path}</span>
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

export default VirtualPatrolListener;