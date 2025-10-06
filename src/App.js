import React from 'react';
import './App.css';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import Footer from './components/Footer';
import VirtualPatrolListener from './components/VirtualPatrolListener';

function App() {
  return (
    <div className="App">
      <Header />
      <Hero />
      <Features />
      <VirtualPatrolListener />
      <Footer />
    </div>
  );
}

export default App;