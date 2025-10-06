import React from 'react';

const Features = () => {
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
      </div>
    </section>
  );
};

export default Features;