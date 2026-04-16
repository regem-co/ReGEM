export const getSelectedPm = () => {
  const selectedFromSession =
    typeof window !== 'undefined' && window.sessionStorage.getItem('selectedPM');

  let selectedPm = 'card';
  if (selectedFromSession) {
    selectedPm = selectedFromSession;
  }

  return selectedPm;
};

export const setPaymentMethodToSession = (paymentMethod) => {
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem('selectedPM', paymentMethod);
  }
}