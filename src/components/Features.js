import React from 'react';

const Features = () => {
  const features = [
    {
      icon: '⚡',
      title: 'Rápido y Eficiente',
      description: 'Construido con React para máximo rendimiento y experiencia de usuario fluida.'
    },
    {
      icon: '📱',
      title: 'Responsivo',
      description: 'Diseño completamente adaptable que funciona perfectamente en todos los dispositivos.'
    },
    {
      icon: '🎨',
      title: 'Diseño Moderno',
      description: 'Interfaz elegante y limpia con las mejores prácticas de diseño UI/UX.'
    },
    {
      icon: '🔒',
      title: 'Seguro',
      description: 'Implementado con las mejores prácticas de seguridad para proteger tus datos.'
    },
    {
      icon: '⚙️',
      title: 'Configurable',
      description: 'Altamente personalizable para adaptarse a tus necesidades específicas.'
    },
    {
      icon: '🚀',
      title: 'Escalable',
      description: 'Arquitectura robusta que crece con tu negocio y necesidades futuras.'
    }
  ];

  return (
    <section className="features" id="features">
      <div className="container">
        <h2>Características Principales</h2>
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