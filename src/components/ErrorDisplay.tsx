import React, { useEffect, useState } from 'react';

export const ErrorDisplay = () => {
  const [errors, setErrors] = useState<string[]>([]);
  useEffect(() => {
    const handleError = (msg: any) => {
      setErrors(prev => [...prev, String(msg)].slice(-10));
    };
    const origError = console.error;
    console.error = (...args) => {
      handleError(args.join(' '));
      origError(...args);
    };
    window.addEventListener('error', (e) => handleError(e.message));
    window.addEventListener('unhandledrejection', (e) => handleError(e.reason));
    
    return () => { 
      console.error = origError; 
    };
  }, []);

  if (errors.length === 0) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999, background: 'red', color: 'white', padding: 10 }}>
      {errors.map((e, i) => <div key={i}>{e}</div>)}
    </div>
  );
};
