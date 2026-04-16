export const shortenString = (string, limit) => {
  if (!string) {
    return '';
  }

  if (string.length <= limit) {
    return string;
  }

  if (string.length > limit) {
    return string.slice(0, limit - 4) + '...';
  }
};

export const limitText = (text, limit) => {
  if (!text || !limit) {
    return null;
  }
  if (text.length > limit) {
    const newText = text.substring(0, limit) + '...';
    return newText;
  }

  return text;
};
