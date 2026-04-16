import React, { createContext, useContext, useState } from 'react';

// Create Context
const LoadingContext = createContext();

// Provider Component
export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

// Custom Hook for using context
export const useLoading = () => useContext(LoadingContext);
