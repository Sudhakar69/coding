const keys = {
  config: "finfrnd_drive_config",
  cachedMpin: "finfrnd_cached_mpin",
  passkeyId: "finfrnd_passkey_id",
};

const loginForm = document.getElementById("login-form");
const mpinInput = document.getElementById("mpin");
const forgotMpinBtn = document.getElementById("forgot-mpin");
const driveFileIdInput = document.getElementById("drive-file-id");
const driveApiKeyInput = document.getElementById("drive-api-key");
const registerWebhookInput = document.getElementById("register-webhook");
const registerBtn = document.getElementById("register-btn");
const enrollBioBtn = document.getElementById("enroll-bio-btn");
const biometricBtn = document.getElementById("biometric-btn");
const statusText = document.getElementById("status");

const state = {
  config: load(keys.config, { driveFileId: "", driveApiKey: "", registerWebhook: "" }),
  cachedMpin: load(keys.cachedMpin, ""),
  passkeyId: localStorage.getItem(keys.passkeyId) || "",
};

hydrateConfig();
setBiometricAvailability();

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const mpin = cleanMpin(mpinInput.value);

  if (mpin.length !== 6) {
    setStatus("Please enter a valid 6 digit MPIN.", true);
    return;
  }

  persistConfig();
  setStatus("Checking MPIN from Google Drive...");

  try {
    const records = await fetchCredentialRecords();
    const matched = await findMatchingMpin(records, mpin);

    if (!matched) {
      setStatus("Invalid MPIN.", true);
      return;
    }

    state.cachedMpin = await hashText(mpin);
    save(keys.cachedMpin, state.cachedMpin);

    setStatus("MPIN verified. Login successful.", false, true);
  } catch (error) {
    setStatus(error.message, true);
  }
});

forgotMpinBtn.addEventListener("click", () => {
  setStatus("Use your bank reset flow to recover MPIN.");
});

registerBtn.addEventListener("click", async () => {
  persistConfig();

  const mpin = cleanMpin(mpinInput.value);
  if (mpin.length !== 6) {
    setStatus("Enter 6 digit MPIN before registering.", true);
    return;
  }

  if (!state.config.registerWebhook) {
    setStatus("Register webhook URL is missing in app setup.", true);
    return;
  }

  setStatus("Sending registration request...");

  try {
    const payload = {
      mpinHash: await hashText(mpin),
      createdAt: new Date().toISOString(),
    };

    const response = await fetch(state.config.registerWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Register request failed (${response.status}).`);
    }

    setStatus("Registration submitted.", false, true);
  } catch (error) {
    setStatus(`Registration failed: ${error.message}`, true);
  }
});

enrollBioBtn.addEventListener("click", async () => {
  if (!isWebAuthnSupported()) {
    setStatus("Biometric enrollment is not supported on this device/browser.", true);
    return;
  }

  setStatus("Authenticate to enroll biometrics...");

  try {
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: randomBytes(32),
        rp: { name: "FinFrnd" },
        user: {
          id: userIdBytes(),
          name: "finfrnd-user",
          displayName: "FinFrnd User",
        },
        pubKeyCredParams: [{ type: "public-key", alg: -7 }],
        authenticatorSelection: { userVerification: "required", residentKey: "preferred" },
        timeout: 60000,
        attestation: "none",
      },
    });

    if (!credential) {
      throw new Error("No credential returned by authenticator.");
    }

    state.passkeyId = bufferToBase64Url(credential.rawId);
    localStorage.setItem(keys.passkeyId, state.passkeyId);
    setStatus("Biometric enrolled successfully.", false, true);
  } catch (error) {
    setStatus(`Biometric enrollment failed: ${error.message}`, true);
  }
});

biometricBtn.addEventListener("click", async () => {
  if (!state.cachedMpin) {
    setStatus("No cached MPIN found. Login once with MPIN before biometric unlock.", true);
    return;
  }

  if (!state.passkeyId) {
    setStatus("No biometric enrolled on this device. Use app setup to enroll.", true);
    return;
  }

  if (!isWebAuthnSupported()) {
    setStatus("Biometric authentication is not supported on this device/browser.", true);
    return;
  }

  setStatus("Waiting for Face ID / fingerprint verification...");

  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: randomBytes(32),
        allowCredentials: [{ type: "public-key", id: base64UrlToBuffer(state.passkeyId) }],
        userVerification: "required",
        timeout: 60000,
      },
    });

    if (!assertion) {
      throw new Error("Biometric verification did not complete.");
    }

    setStatus("Biometric verified. Welcome back.", false, true);
  } catch (error) {
    setStatus(`Biometric login failed: ${error.message}`, true);
  }
});

async function fetchCredentialRecords() {
  if (!state.config.driveFileId || !state.config.driveApiKey) {
    throw new Error("Drive File ID and API key are required in app setup.");
  }

  const url = new URL(`https://www.googleapis.com/drive/v3/files/${state.config.driveFileId}`);
  url.searchParams.set("alt", "media");
  url.searchParams.set("key", state.config.driveApiKey);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Unable to fetch credentials from Google Drive (${response.status}).`);
  }

  const data = await response.json();
  if (!Array.isArray(data.users)) {
    throw new Error("Credential file format is invalid. Expected { users: [] }.");
  }

  return data.users;
}

async function findMatchingMpin(records, mpin) {
  const mpinHash = await hashText(mpin);
  return records.find((entry) => entry.mpinHash === mpinHash);
}

async function hashText(input) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

function cleanMpin(value) {
  const cleaned = value.replace(/\D/g, "").slice(0, 6);
  mpinInput.value = cleaned;
  return cleaned;
}

mpinInput.addEventListener("input", () => {
  cleanMpin(mpinInput.value);
});

function hydrateConfig() {
  driveFileIdInput.value = state.config.driveFileId;
  driveApiKeyInput.value = state.config.driveApiKey;
  registerWebhookInput.value = state.config.registerWebhook;
}

function persistConfig() {
  state.config = {
    driveFileId: driveFileIdInput.value.trim(),
    driveApiKey: driveApiKeyInput.value.trim(),
    registerWebhook: registerWebhookInput.value.trim(),
  };
  save(keys.config, state.config);
}

function setBiometricAvailability() {
  if (!isWebAuthnSupported()) {
    enrollBioBtn.disabled = true;
    biometricBtn.disabled = true;
    setStatus("This browser/device does not support Face ID / fingerprint unlock.");
  }
}

function isWebAuthnSupported() {
  return typeof window.PublicKeyCredential !== "undefined" && !!navigator.credentials;
}

function userIdBytes() {
  return new Uint8Array([102, 105, 110, 102, 114, 110, 100, 45, 117, 115, 101, 114]);
}

function randomBytes(length) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function bufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  const binary = String.fromCharCode(...bytes);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBuffer(base64Url) {
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0)).buffer;
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

function load(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
