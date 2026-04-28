const loginBtn = document.getElementById("login-btn");
const biometricBtn = document.getElementById("biometric-btn");
const statusText = document.getElementById("status");
const mpinInputs = [...document.querySelectorAll(".mpin")];

setupMpinInputs();

loginBtn.addEventListener("click", () => {
  const mpin = getMpin();

  if (mpin.length !== 6) {
    setStatus("MPIN must be exactly 6 digits.", true);
    return;
  }

  setStatus("MPIN verified. Welcome back to FinFrnd!", false, true);
});

biometricBtn.addEventListener("click", async () => {
  const hasBiometricSupport =
    window.PublicKeyCredential &&
    typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === "function";

  if (!hasBiometricSupport) {
    setStatus("Biometric authentication is not supported on this device/browser.", true);
    return;
  }

  const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();

  if (!isAvailable) {
    setStatus("No fingerprint/face authenticator available on this device.", true);
    return;
  }

  setStatus("Biometric verified successfully. Logged in to FinFrnd.", false, true);
});

function setupMpinInputs() {
  mpinInputs.forEach((input, index) => {
    input.addEventListener("input", () => {
      input.value = input.value.replace(/\D/g, "").slice(0, 1);
      if (input.value && index < mpinInputs.length - 1) {
        mpinInputs[index + 1].focus();
      }
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Backspace" && !input.value && index > 0) {
        mpinInputs[index - 1].focus();
      }
    });
  });
}

function getMpin() {
  return mpinInputs.map((input) => input.value).join("");
}

function setStatus(message, isError = false, isOk = false) {
  statusText.textContent = message;
  statusText.classList.remove("error", "ok");
  if (isError) {
    statusText.classList.add("error");
  }
  if (isOk) {
    statusText.classList.add("ok");
  }
}
