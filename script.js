// =============================================
// Global variables (values shared across the file)
// =============================================

// Will hold the API Gateway base URL, loaded from config.json
let ApiGatewayUrl = "";

// Will hold information about the Cognito user pool
let poolData = {};

// Will hold the Cognito User Pool object (we initialize it later)
let userPool;


// =============================================
// Load configuration from config.json
// =============================================
async function loadConfig() {
  // Fetch config.json (located in the same directory as index.html)
  const res = await fetch("config.json");

  // Parse the response body into a JavaScript object
  const config = await res.json();

  // Save values globally for later use
  ApiGatewayUrl = config.apiGatewayUrl;
  poolData = {
    UserPoolId: config.userPoolId,
    ClientId: config.userPoolClientId,
  };

  // Initialize Cognito User Pool
  userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

  // After config is loaded and userPool exists, check if a user session already exists
  checkSession();
}

// Run loadConfig once the HTML page has finished loading
window.addEventListener("DOMContentLoaded", loadConfig);


// =============================================
// Helper function: get the access token from storage
// =============================================
function getAuthToken() {
  return sessionStorage.getItem("accessToken");
}


// =============================================
// Check if the user already has a valid session
// =============================================
function checkSession() {
  // Get the "current user" object from Cognito (if they previously logged in)
  const cognitoUser = userPool.getCurrentUser();

  if (!cognitoUser) {
    console.log("No existing user session.");
    return;
  }

  // Try to refresh the session
  cognitoUser.getSession(function (err, session) {
    if (err) {
      console.error("Session error:", err);
      return;
    }

    if (session.isValid()) {
      // Extract tokens from the session
      const idToken = session.getIdToken().getJwtToken();
      const accessToken = session.getAccessToken().getJwtToken();

      // Save tokens into browser storage
      sessionStorage.setItem("idToken", idToken);       // identity info
      sessionStorage.setItem("accessToken", accessToken); // used for API calls

      console.log("Session restored and tokens refreshed.");

      // Show upload section (user is authenticated)
      document.getElementById("uploadSection").style.display = "block";
    } else {
      console.log("Session is invalid or expired.");
    }
  });
}


// =============================================
// Login with username + password
// =============================================
function login() {
  // Read username + password from form input fields
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  // Prepare login details for Cognito
  const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
    Username: username,
    Password: password,
  });

  // Prepare Cognito user object
  const userData = {
    Username: username,
    Pool: userPool,
  };
  const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

  // Try to log in
  cognitoUser.authenticateUser(authenticationDetails, {
    onSuccess: function (result) {
      // Extract tokens on success
      const accessToken = result.getAccessToken().getJwtToken();
      const idToken = result.getIdToken().getJwtToken();

      alert("Login successful!");

      // Save tokens for later use
      sessionStorage.setItem("accessToken", accessToken);
      sessionStorage.setItem("idToken", idToken);

      // Show upload section now that user is logged in
      document.getElementById("uploadSection").style.display = "block";
    },

    onFailure: function (err) {
      console.error(err);
      alert("Login failed: " + err.message);
    },
  });
}


// =============================================
// Upload a file
// =============================================
async function uploadFile() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0]; // first selected file

  if (!file) {
    alert("Please select a file to upload.");
    return;
  }

  const filename = encodeURIComponent(file.name); // make filename URL-safe
  const backendUrl = `${ApiGatewayUrl}/generate-upload-url?filename=${filename}`;

  const token = getAuthToken(); // <-- use access token

  try {
    // Ask backend for a presigned S3 upload URL
    const res = await fetch(backendUrl, {
      method: "GET",
      headers: { Authorization: token },
    });

    if (!res.ok) throw new Error(`Failed to get upload URL: ${res.status}`);

    const { upload_url } = await res.json();
    console.log("Got presigned upload URL (expires soon) for:", file.name);


    // Upload file directly to S3 using the presigned URL
    const uploadRes = await fetch(upload_url, {
      method: "PUT",
      body: file,
    });

    if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`);

    document.getElementById("uploadStatus").innerText = "✅ Upload successful!";
  } catch (err) {
    console.error("Upload error:", err);
    document.getElementById("uploadStatus").innerText = `❌ Upload failed: ${err.message}`;
  }
}


// =============================================
// List all files
// =============================================
async function listFiles() {
  const listUrl = `${ApiGatewayUrl}/list`;
  const token = getAuthToken();

  if (!token) {
    alert("You are not logged in.");
    return;
  }

  try {
    // Call backend list endpoint
    const res = await fetch(listUrl, {
      method: "GET",
      headers: { Authorization: token },
    });

    if (!res.ok) throw new Error(`List failed: ${res.status}`);

    const { files } = await res.json();
    const fileListElem = document.getElementById("fileList");
    fileListElem.innerHTML = ""; // clear previous list

    // For each file, create <li> with Download + Delete buttons
    files.forEach((filename) => {
      const item = document.createElement("li");

      const nameSpan = document.createElement("span");
      nameSpan.textContent = filename;
      item.appendChild(nameSpan);

      const downloadBtn = document.createElement("button");
      downloadBtn.textContent = "Download";
      downloadBtn.style.marginLeft = "10px";
      downloadBtn.onclick = () => downloadFile(filename);
      item.appendChild(downloadBtn);

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.style.marginLeft = "10px";
      deleteBtn.onclick = () => deleteFile(filename);
      item.appendChild(deleteBtn);

      fileListElem.appendChild(item);
    });

    document.getElementById("listStatus").innerText = "✅ Files listed successfully.";
  } catch (err) {
    console.error("List error:", err);
    document.getElementById("listStatus").innerText = `❌ List failed: ${err.message}`;
  }
}


// =============================================
// Download a file
// =============================================
async function downloadFile(filename) {
  const backendUrl = `${ApiGatewayUrl}/download?filename=${encodeURIComponent(filename)}`;
  const token = getAuthToken();

  if (!token) {
    alert("You are not logged in.");
    return;
  }

  try {
    // Ask backend for a presigned download URL
    const res = await fetch(backendUrl, {
      method: "GET",
      headers: { Authorization: token },
    });

    if (!res.ok) throw new Error(`Failed to get download URL: ${res.status}`);

    const { download_url } = await res.json();
    console.log("Download URL:", download_url);

    // Open download in a new browser tab
    window.open(download_url, "_blank");
  } catch (err) {
    console.error("Download error:", err);
    alert(`❌ Download failed: ${err.message}`);
  }
}


// =============================================
// Delete a file
// =============================================
async function deleteFile(filename) {
  const deleteUrl = `${ApiGatewayUrl}/delete?filename=${encodeURIComponent(filename)}`;
  const token = getAuthToken();

  if (!token) {
    alert("You are not logged in.");
    return;
  }

  if (!confirm(`Are you sure you want to delete "${filename}"?`)) {
    return; // user clicked "Cancel"
  }

  try {
    // Call backend delete endpoint
    const res = await fetch(deleteUrl, {
      method: "DELETE",
      headers: { Authorization: token },
    });

    if (!res.ok) throw new Error(`Delete failed: ${res.status}`);

    const result = await res.json();
    console.log("Delete result:", result);
    alert(`✅ ${filename} deleted successfully.`);

    // Refresh list
    await listFiles();
  } catch (err) {
    console.error("Delete error:", err);
    alert(`❌ Delete failed: ${err.message}`);
  }
}


// =============================================
// Logout
// =============================================
function logout() {
  const cognitoUser = userPool.getCurrentUser();
  if (cognitoUser) {
    cognitoUser.signOut(); // logs out of Cognito session
  }

  // Remove tokens from storage
  sessionStorage.clear();

  // Hide authenticated section
  document.getElementById("uploadSection").style.display = "none";
  alert("Logged out.");
  window.location.reload(); // refresh page to reset UI
}
