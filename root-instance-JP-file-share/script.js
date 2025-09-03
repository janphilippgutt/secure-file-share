'use strict'; // Prevents accidental global variables

// Global vars, initialized later when config.json is loaded
let ApiGatewayUrl = '';
let userPool = null;

// Load config.json (written by deploy.sh) when the page loads
async function loadConfig() {
  try {
    // Fetch config.json fresh every time (avoid caching issues)
    const response = await fetch('config.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Could not load config.json');
    const config = await response.json();

    // Save API URL for later fetch() calls
    ApiGatewayUrl = config.apiGatewayUrl;

    // Configure Cognito User Pool
    const poolData = {
      UserPoolId: config.userPoolId,
      ClientId: config.userPoolClientId
    };
    userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

    // Check if user has an existing session (auto-login after refresh)
    checkSession();
  } catch (err) {
    console.error('Error loading config:', err);
  }
}
window.addEventListener('DOMContentLoaded', loadConfig); // Run above on page load

// --- Utility: Refresh tokens if expired ---
async function ensureSession() {
  if (!userPool) throw new Error('Config not loaded yet');
  const cu = userPool.getCurrentUser();
  if (!cu) throw new Error('No user logged in');

  return new Promise((resolve, reject) => {
    cu.getSession((err, session) => {
      if (err || !session?.isValid()) {
        reject(err || new Error('Invalid session'));
      } else {
        // Store fresh tokens in localStorage for persistence across tabs
        localStorage.setItem('accessToken', session.getAccessToken().getJwtToken());
        localStorage.setItem('idToken', session.getIdToken().getJwtToken());
        resolve();
      }
    });
  });
}

// --- Utility: Create Authorization header with Bearer token ---
async function authHeader() {
  await ensureSession(); // Make sure we’re using a valid session
  const token = localStorage.getItem('accessToken'); // Always use accessToken for APIs
  return { Authorization: `Bearer ${token}` };
}

// --- Login logic ---
function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
    Username: username,
    Password: password,
  });

  const userData = {
    Username: username,
    Pool: userPool,
  };
  const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

  cognitoUser.authenticateUser(authenticationDetails, {
    onSuccess: (result) => {
      // Store tokens in localStorage for persistence across tabs
      localStorage.setItem('accessToken', result.getAccessToken().getJwtToken());
      localStorage.setItem('idToken', result.getIdToken().getJwtToken());

      // Show upload section after successful login
      document.getElementById('uploadSection').style.display = 'block';
      alert('Login successful!');
    },
    onFailure: (err) => {
      alert('Login failed: ' + err.message);
    },
  });
}

// --- Check if user already logged in ---
function checkSession() {
  const cu = userPool.getCurrentUser();
  if (!cu) return; // Not logged in

  cu.getSession((err, session) => {
    if (err || !session?.isValid()) return;
    // Session still valid → restore UI
    localStorage.setItem('accessToken', session.getAccessToken().getJwtToken());
    localStorage.setItem('idToken', session.getIdToken().getJwtToken());
    document.getElementById('uploadSection').style.display = 'block';
  });
}

// --- Logout ---
function logout() {
  const cu = userPool?.getCurrentUser();
  if (cu) cu.signOut();
  localStorage.clear(); // Remove tokens from browser
  document.getElementById('uploadSection').style.display = 'none';
  location.reload(); // Refresh page so cached data disappears
}

// --- Upload file ---
async function uploadFile() {
  try {
    await ensureSession();
    const file = document.getElementById('fileInput').files[0];
    if (!file) return alert('Please select a file first.');

    // Step 1: Ask backend for presigned upload URL
    const response = await fetch(
      `${ApiGatewayUrl}/generate-upload-url?filename=${encodeURIComponent(file.name)}`,
      { method: 'GET', headers: await authHeader() }
    );
    if (!response.ok) throw new Error(`Failed to get upload URL: ${response.status}`);
    const { upload_url } = await response.json();

    // Step 2: Upload file directly to S3 using presigned URL
    const putResponse = await fetch(upload_url, { method: 'PUT', body: file });
    if (!putResponse.ok) throw new Error(`Upload failed: ${putResponse.status}`);

    document.getElementById('uploadStatus').innerText = '✅ Upload successful!';
  } catch (err) {
    alert('Upload error: ' + err.message);
  }
}

// --- List files ---
async function listFiles() {
  try {
    await ensureSession();
    const response = await fetch(`${ApiGatewayUrl}/list`, {
      method: 'GET',
      headers: await authHeader(),
    });
    if (!response.ok) throw new Error(`Failed to list files: ${response.status}`);
    const data = await response.json();

    // Safely extract array of filenames
    const files = Array.isArray(data) ? data : Array.isArray(data.files) ? data.files : [];

    const fileList = document.getElementById('fileList');
    fileList.innerHTML = ''; // Clear old list

    if (files.length === 0) {
      fileList.innerHTML = '<li>No files found.</li>';
      return;
    }

    files.forEach((filename) => {
      const li = document.createElement('li');
      li.innerHTML = `
        ${filename}
        <button onclick="downloadFile('${filename}')">Download</button>
        <button onclick="deleteFile('${filename}')">Delete</button>
      `;
      fileList.appendChild(li);
    });
  } catch (err) {
    alert('List error: ' + err.message);
  }
}


// --- Download file ---
async function downloadFile(filename) {
  try {
    await ensureSession();
    const response = await fetch(
      `${ApiGatewayUrl}/download?filename=${encodeURIComponent(filename)}`,
      { headers: await authHeader() }
    );
    if (!response.ok) throw new Error(`Failed to get download URL: ${response.status}`);
    const { download_url } = await response.json();

    // Open securely (prevent window.opener access)
    const w = window.open(download_url, '_blank', 'noopener,noreferrer');
    if (w) w.opener = null;
  } catch (err) {
    alert('Download error: ' + err.message);
  }
}

// --- Delete file ---
async function deleteFile(filename) {
  try {
    await ensureSession();
    const response = await fetch(
      `${ApiGatewayUrl}/delete?filename=${encodeURIComponent(filename)}`,
      { method: 'DELETE', headers: await authHeader() }
    );
    if (!response.ok) throw new Error(`Failed to delete: ${response.status}`);
    alert('File deleted successfully!');
    listFiles(); // Refresh list
  } catch (err) {
    alert('Delete error: ' + err.message);
  }
}
