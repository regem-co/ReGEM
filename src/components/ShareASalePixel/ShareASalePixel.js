import React from 'react';

const ShareASalePixel = () => {
  console.log('pixel showing');
  return (
    <div>
      <img
        src="https://www.shareasale.com/sale.cfm?tracking=12345678&amount=66.00&merchantID=124637&transtype=sale"
        width="1"
        height="1"
      />
    </div>
  );
};

export default ShareASalePixel;
