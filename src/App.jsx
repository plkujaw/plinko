import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PlinkoGame from './components/PlinkoGame';
import PlinkoIframe from './components/PlinkoIframe';
import './styles.css';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/plinko" element={<PlinkoGame />} />
        <Route path="/" element={<PlinkoIframe />} />
      </Routes>
    </Router>
  );
}