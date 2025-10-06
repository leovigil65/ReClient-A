import React, { useState } from 'react';
import './VPEventSimulator.css';

const VPEventSimulator = () => {
  const [isLoading, setIsLoading] = useState(false);

  const sendTestEvent = async (eventType) => {
    setIsLoading(true);
    
    try {
      let eventData = {
        event_type: eventType,
        timestamp: new Date().toISOString()
      };

      // Customize event data based on type
      switch (eventType) {
        case 'intrusion':
          eventData = {
            ...eventData,
            camera_id: `CAM_${Math.floor(Math.random() * 10).toString().padStart(3, '0')}`,
            metadata: {
              detection_count: Math.floor(Math.random() * 5) + 1,
              avg_confidence: Math.floor(Math.random() * 40) + 60, // 60-100%
              json_path: `/data/detections/cam${Math.floor(Math.random() * 10)}_${Date.now()}.json`
            }
          };
          break;
          
        case 'confirmed_intrusion':
          eventData = {
            ...eventData,
            camera_id: `CAM_${Math.floor(Math.random() * 10).toString().padStart(3, '0')}`,
            title: 'Confirmed human intrusion in restricted area',
            metadata: {
              json_path: `/data/confirmed/cam${Math.floor(Math.random() * 10)}_${Date.now()}.json`,
              confidence: Math.floor(Math.random() * 20) + 80 // 80-100%
            }
          };
          break;
          
        case 'camera_offline':
          const cameraNames = ['Front Entrance', 'Parking Lot', 'Side Gate', 'Rear Exit', 'Main Hall'];
          eventData = {
            ...eventData,
            camera_id: `CAM_${Math.floor(Math.random() * 10).toString().padStart(3, '0')}`,
            metadata: {
              camera_name: cameraNames[Math.floor(Math.random() * cameraNames.length)] + ' Camera',
              json_path: `/data/status/cam${Math.floor(Math.random() * 10)}_offline_${Date.now()}.json`,
              last_seen: new Date(Date.now() - Math.random() * 3600000).toISOString() // Random time in last hour
            }
          };
          break;
          
        default:
          eventData.camera_id = `CAM_${Math.floor(Math.random() * 10).toString().padStart(3, '0')}`;
      }

      const response = await fetch('/api/vp-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData)
      });

      if (response.ok) {
        console.log(`✅ Test event sent: ${eventType}`);
      } else {
        console.error('Error sending test event:', await response.text());
      }
    } catch (error) {
      console.error('Error sending test event:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendRandomEvent = () => {
    const eventTypes = ['intrusion', 'confirmed_intrusion', 'camera_offline'];
    const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    sendTestEvent(randomType);
  };

  const sendMultipleEvents = async () => {
    setIsLoading(true);
    
    const eventTypes = ['intrusion', 'confirmed_intrusion', 'camera_offline'];
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    try {
      for (let i = 0; i < 5; i++) {
        const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        await sendTestEvent(randomType);
        await delay(1000); // Wait 1 second between events
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="vp-event-simulator">
      <h3>🧪 Virtual Patrol Event Simulator</h3>
      <p className="simulator-description">
        Use these buttons to simulate Virtual Patrol events for testing the listener.
      </p>
      
      <div className="simulator-controls">
        <div className="event-buttons">
          <button 
            onClick={() => sendTestEvent('intrusion')}
            disabled={isLoading}
            className="test-btn intrusion-btn"
          >
            🚨 Send Intrusion Event
          </button>
          
          <button 
            onClick={() => sendTestEvent('confirmed_intrusion')}
            disabled={isLoading}
            className="test-btn confirmed-btn"
          >
            ⚠️ Send Confirmed Intrusion
          </button>
          
          <button 
            onClick={() => sendTestEvent('camera_offline')}
            disabled={isLoading}
            className="test-btn offline-btn"
          >
            📴 Send Camera Offline
          </button>
        </div>
        
        <div className="bulk-actions">
          <button 
            onClick={sendRandomEvent}
            disabled={isLoading}
            className="test-btn random-btn"
          >
            🎲 Send Random Event
          </button>
          
          <button 
            onClick={sendMultipleEvents}
            disabled={isLoading}
            className="test-btn multiple-btn"
          >
            📊 Send 5 Random Events
          </button>
        </div>
      </div>
      
      {isLoading && (
        <div className="loading-indicator">
          <span>Sending events...</span>
        </div>
      )}
    </div>
  );
};

export default VPEventSimulator;