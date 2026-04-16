// src/components/GlobalLoader.js
import React from 'react';
import { useLoading } from './LoadingContext';
import './GlobalLoader.css'; // Create a separate CSS file for loader styles

const GlobalLoader = () => {
  const { isLoading } = useLoading();

  if (!isLoading) return null;

  return (
    <div className="loader-overlay">
      <div className="loader"></div>
    </div>
  );
};

export default GlobalLoader;
