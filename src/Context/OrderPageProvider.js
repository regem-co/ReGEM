import React, { createContext, useContext, useState } from 'react';

// Create a context to store the data
const OrderPageContext = createContext();

export const useOrderPage = () => {
  return useContext(OrderPageContext);
};

export const OrderPageProvider = ({ children }) => {
  const [orderData, setOrderData] = useState(null);

  return (
    <OrderPageContext.Provider value={{ orderData, setOrderData }}>
      {children}
    </OrderPageContext.Provider>
  );
};
