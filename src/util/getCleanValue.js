
const getCleanValue = (obj, key) => {
  if (!obj || typeof obj !== 'object') return null;
  const foundKey = Object.keys(obj).find(k => k.trim() === key);
  const value = foundKey ? obj[foundKey] : null;
  return typeof value === 'string' ? value.trim() : value;
};

export default getCleanValue;
