// script.js

// =======================================================
// !!! IMPORTANT !!!
// You MUST replace the placeholders below with your
// Terraform output values BEFORE using this script.
// =======================================================

const ApiGatewayUrl = "<YOUR_API_GATEWAY_URL_HERE>" // REPLACE with your api url from outputs

const poolData = {
  UserPoolId: '<YOUR_USER_POOL_ID_HERE>', // REPLACE with your user_pool_id from outputs
  ClientId: '<YOUR_USER_POOL_CLIENT_ID_HERE>' // REPLACE with your user_pool_client_id from outputs
};

const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

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

  cognitoUser.authenticateUser(authenticationDetails, {
    onSuccess: function (result) {
      const accessToken = result.getAccessToken().getJwtToken();
      const idToken = result.getIdToken().getJwtToken();

      console.log("Access Token:", accessToken);
      console.log("ID Token:", idToken);

      alert("Login successful!");

      // Store token globally or in localStorage for future requests
      window.accessToken = accessToken;
      window.idToken = idToken;

      console.log("Sending token:", window.idToken);


      // Show upload section
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
  const token = window.idToken;
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

  try {
    const res = await fetch(listUrl, {
      method: "GET",
      headers: {
        Authorization: window.idToken, // ✅ ID token from login
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
  const token = window.idToken;

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

  if (!confirm(`Are you sure you want to delete "${filename}"?`)) {
    return; // User cancelled
  }

  try {
    const res = await fetch(deleteUrl, {
      method: "DELETE", // Use DELETE method
      headers: {
        Authorization: window.idToken,
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
