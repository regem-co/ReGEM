import React, { useEffect } from 'react';

const UnsavedChangesPrompt = () => {
  useEffect(() => {
    const handleBeforeUnload = event => {
      event.preventDefault();
      event.returnValue = ''; // Required for Chrome
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return null;
};

export default UnsavedChangesPrompt;
