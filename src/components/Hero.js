import React from 'react';

const Hero = () => {
  return (
    <section className="hero" id="home">
      <div className="container">
        <div className="hero-content">
          <h1>Bienvenido a ReClient-A</h1>
          <p>
            Una aplicación web moderna construida con React. 
            Experimenta la velocidad, flexibilidad y el poder de las tecnologías web más avanzadas.
          </p>
          <a href="#features" className="cta-button">
            Explorar Características
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;