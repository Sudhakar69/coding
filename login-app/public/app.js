const mpinInput = document.getElementById('mpin');

if (mpinInput) {
  mpinInput.addEventListener('input', () => {
    mpinInput.value = mpinInput.value.replace(/\D/g, '').slice(0, 4);
  });
}
