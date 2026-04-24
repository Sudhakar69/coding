const keys = {
  config: "finfrnd_drive_config",
  cachedMpin: "finfrnd_cached_mpin",
};

const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const cacheMpinInput = document.getElementById("cache-mpin");
const driveFileIdInput = document.getElementById("drive-file-id");
const driveApiKeyInput = document.getElementById("drive-api-key");
const registerWebhookInput = document.getElementById("register-webhook");
const registerBtn = document.getElementById("register-btn");
const fingerBtn = document.getElementById("finger-btn");
const statusText = document.getElementById("status");
const mpinInputs = [...document.querySelectorAll(".mpin")];

const state = {
  config: load(keys.config, { driveFileId: "", driveApiKey: "", registerWebhook: "" }),
  cachedMpin: load(keys.cachedMpin, {}),
};

hydrateConfig();
setupMpinInputs();
autofillMpinFromCache();

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  const mpin = getMpin();

  if (mpin.length !== 4) {
    setStatus("MPIN must be exactly 4 digits.", true);
    return;
  }

  persistConfig();
  setStatus("Checking credentials from Google Drive...");

  try {
    const records = await fetchCredentialRecords();
    const match = await findMatchingUser(records, username, password, mpin);

    if (!match) {
      setStatus("Invalid username, password, or MPIN.", true);
      return;
    }

    if (cacheMpinInput.checked) {
      state.cachedMpin[username] = await hashText(mpin);
      save(keys.cachedMpin, state.cachedMpin);
    }

    setStatus(`Welcome ${username}! Login successful.`, false, true);
  } catch (error) {
    setStatus(error.message, true);
  }
});

registerBtn.addEventListener("click", async () => {
  persistConfig();

  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  const mpin = getMpin();

  if (!username || !password || mpin.length !== 4) {
    setStatus("Enter username, password, and a 4-digit MPIN before registering.", true);
    return;
  }

  if (!state.config.registerWebhook) {
    setStatus("Register webhook URL is missing in setup section.", true);
    return;
  }

  setStatus("Sending registration request...");

  try {
    const payload = {
      username,
      passwordHash: await hashText(password),
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

    setStatus("Registration submitted to Google Drive webhook.", false, true);
  } catch (error) {
    setStatus(`Registration failed: ${error.message}`, true);
  }
});

fingerBtn.addEventListener("click", async () => {
  const username = usernameInput.value.trim();
  const mpin = getMpin();

  if (!username || mpin.length !== 4) {
    setStatus("Enter username and MPIN first.", true);
    return;
  }

  const savedHash = state.cachedMpin[username];
  if (!savedHash) {
    setStatus("No local cached MPIN found for this user.", true);
    return;
  }

  const inputHash = await hashText(mpin);
  if (savedHash !== inputHash) {
    setStatus("Cached MPIN mismatch.", true);
    return;
  }

  setStatus("Local MPIN check passed. Fingerprint verification mocked as successful.", false, true);
});

async function fetchCredentialRecords() {
  if (!state.config.driveFileId || !state.config.driveApiKey) {
    throw new Error("Drive File ID and API key are required in setup section.");
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

async function findMatchingUser(records, username, password, mpin) {
  const passwordHash = await hashText(password);
  const mpinHash = await hashText(mpin);

  return records.find(
    (entry) =>
      entry.username === username &&
      entry.passwordHash === passwordHash &&
      entry.mpinHash === mpinHash
  );
}

async function hashText(input) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

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

function autofillMpinFromCache() {
  usernameInput.addEventListener("blur", async () => {
    const username = usernameInput.value.trim();
    if (!username || !state.cachedMpin[username]) {
      return;
    }

    setStatus("Cached MPIN exists for this user. Enter MPIN to continue.");
  });
}

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
