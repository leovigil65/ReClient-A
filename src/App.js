import React from 'react';
import './App.css';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import Footer from './components/Footer';
import VirtualPatrolRedisClient from './components/VirtualPatrolListener';

function App() {
  return (
    <div className="App">
      <Header />
   
      <VirtualPatrolRedisClient />
      <Footer />
    </div>
  );
}

export default App;