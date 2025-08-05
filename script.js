let ApiGatewayUrl = "";
let poolData = {};

async function loadConfig() {
  const res = await fetch("config.json");
  const config = await res.json();
  ApiGatewayUrl = config.apiGatewayUrl;
  poolData = {
    UserPoolId: config.userPoolId,
    ClientId: config.userPoolClientId
  };

  // Initialize Cognito pool
  userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
}

// Call loadConfig on page load
window.addEventListener("DOMContentLoaded", loadConfig);


function checkSession() {
  const cognitoUser = userPool.getCurrentUser();

  if (!cognitoUser) {
    console.log("No existing user session.");
    return;
  }

  cognitoUser.getSession(function(err, session) {
    if (err) {
      console.error("Session error:", err);
      return;
    }

    if (session.isValid()) {
      const idToken = session.getIdToken().getJwtToken();
      const accessToken = session.getAccessToken().getJwtToken();

      sessionStorage.setItem("idToken", idToken);
      sessionStorage.setItem("accessToken", accessToken);

      console.log("Session restored and tokens refreshed.");
      document.getElementById("uploadSection").style.display = "block";
    } else {
      console.log("Session is invalid or expired.");
    }
  });
}


function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const authenticationData = {
    Username: username,
    Password: password,
  };

  const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);

  const userData = {
    Username: username,
    Pool: userPool,
  };

  const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

  // Send login request to AWS Cognito, try log the user in using the provided data (username + password)
  cognitoUser.authenticateUser(authenticationDetails, {
    onSuccess: function (result) {
      const accessToken = result.getAccessToken().getJwtToken(); // Extract the actual token from Cognito's response
      const idToken = result.getIdToken().getJwtToken();

      console.log("Access Token:", accessToken);
      console.log("ID Token:", idToken);

      alert("Login successful!");

      // Save tokens to the browsers sessionStorage (values are stored globally in the browser's memory, but only for the current tab/window)
      sessionStorage.setItem("accessToken", accessToken);
      sessionStorage.setItem("idToken", idToken);

      console.log("Sending token:", idToken);


      // Make upload interface visible
      document.getElementById("uploadSection").style.display = "block";
    },

    onFailure: function (err) {
      console.error(err);
      alert("Login failed: " + err.message);
    },
  });
}

async function uploadFile() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];

  if (!file) {
    alert("Please select a file to upload.");
    return;
  }

  const filename = encodeURIComponent(file.name);
  const backendUrl = `${ApiGatewayUrl}/generate-upload-url?filename=${filename}`;
  // Avoid reusing the same variable name in different scopes by naming retrieved idToken "token" (not "idToken" again)
  const token = sessionStorage.getItem("idToken");

  try {
    const res = await fetch(backendUrl, {
      method: "GET",
      headers: {
        Authorization: token,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to get upload URL: ${res.status}`);
    }

    const { upload_url } = await res.json();
    console.log("Presigned upload URL:", upload_url);

    const uploadRes = await fetch(upload_url, {
      method: "PUT",
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error(`Upload failed: ${uploadRes.status}`);
    }

    document.getElementById("uploadStatus").innerText = "✅ Upload successful!";
  } catch (err) {
    console.error("Upload error:", err);
    document.getElementById("uploadStatus").innerText = `❌ Upload failed: ${err.message}`;
  }
}

async function listFiles() {
  const listUrl = `${ApiGatewayUrl}/list`;
  const token = sessionStorage.getItem("idToken");
  if (!token) {
  alert("You are not logged in.");
  return;
}

  try {
    const res = await fetch(listUrl, {
      method: "GET",
      headers: {
        Authorization: token, // ✅ ID token from login
      },
    });

    if (!res.ok) {
      throw new Error(`List failed: ${res.status}`);
    }

    const { files } = await res.json();
    const fileListElem = document.getElementById("fileList");
    fileListElem.innerHTML = ""; // clear previous list

    files.forEach((filename) => {
      const item = document.createElement("li");

      const nameSpan = document.createElement("span");
      nameSpan.textContent = filename;
      item.appendChild(nameSpan);

      // Create Download Button
      const downloadBtn = document.createElement("button");
      downloadBtn.textContent = "Download";
      downloadBtn.style.marginLeft = "10px";
      downloadBtn.onclick = () => downloadFile(filename);
      item.appendChild(downloadBtn);

      // Create Delete Button
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


async function downloadFile(filename) {
  const backendUrl = `${ApiGatewayUrl}/download?filename=${encodeURIComponent(filename)}`;
  const token = sessionStorage.getItem("idToken");
  if (!token) {
  alert("You are not logged in.");
  return;
}

  try {
    const res = await fetch(backendUrl, {
      method: "GET",
      headers: {
        Authorization: token,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to get download URL: ${res.status}`);
    }

    const { download_url } = await res.json();
    console.log("Download URL:", download_url);

    // Trigger download by navigating to presigned URL
    window.open(download_url, "_blank");
  } catch (err) {
    console.error("Download error:", err);
    alert(`❌ Download failed: ${err.message}`);
  }
}

async function deleteFile(filename) {
  const deleteUrl = `${ApiGatewayUrl}/delete?filename=${encodeURIComponent(filename)}`;
  const token = sessionStorage.getItem("idToken");
  if (!token) {
  alert("You are not logged in.");
  return;
}

  if (!confirm(`Are you sure you want to delete "${filename}"?`)) {
    return; // User cancelled
  }

  try {
    const res = await fetch(deleteUrl, {
      method: "DELETE", // Use DELETE method
      headers: {
        Authorization: token,
      },
    });

    if (!res.ok) {
      throw new Error(`Delete failed: ${res.status}`);
    }

    const result = await res.json();
    console.log("Delete result:", result);
    alert(`✅ ${filename} deleted successfully.`);

    // Refresh the list
    await listFiles();
  } catch (err) {
    console.error("Delete error:", err);
    alert(`❌ Delete failed: ${err.message}`);
  }
}

// Hide the upload section if the user is not logged in
if (!sessionStorage.getItem("idToken")) {
  document.getElementById("uploadSection").style.display = "none";
}

// Logout
function logout() {
  const cognitoUser = userPool.getCurrentUser();
  if (cognitoUser) {
    cognitoUser.signOut(); // logs out of Cognito session
  }

  // Clear tokens from storage
  sessionStorage.clear();

  // Hide authenticated section
  document.getElementById("uploadSection").style.display = "none";
  alert("Logged out.");
}


window.onload = function () {
  checkSession();
};
