import React from 'react';

export default function PlinkoIframe() {
  return (
    <iframe
      src="/plinko"
      style={{
        width: '100%',
        height: '100vh',
        border: 'none',
        backgroundColor: '#1a1a1a'
      }}
      title="Plinko Game"
    />
  );
}