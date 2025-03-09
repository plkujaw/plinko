import React from 'react';
import PlinkoGame from './components/PlinkoGame';
import './styles.css';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-4">
      <div className="max-w-[1400px] mx-auto">
        <PlinkoGame />
      </div>
    </div>
  );
}