import React from 'react';

const Hero = () => {
  return (
    <section className="hero" id="home">
      <div className="container">
        <div className="hero-content">
          <h1>Welcome to ReClient-A</h1>
          <p>
            A modern web application built with React. 
            Experience the speed, flexibility and power of the most advanced web technologies.
          </p>
          <a href="#features" className="cta-button">
            Explore Features
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;