// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCmE9EamHPIDH4F9pNWixngRISuyLumzJk",
  authDomain: "first-project-4947f.firebaseapp.com",
  projectId: "first-project-4947f",
  storageBucket: "first-project-4947f.firebasestorage.app",
  messagingSenderId: "87806757474",
  appId: "1:87806757474:web:0369d9fdab07725d069f3b",
  measurementId: "G-KLZ995N6DF",
};

// Initialize Firebase
try {
  firebase.initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

// Get the modal
var modal = document.getElementById("myModal");
// Get the button that opens the modal
var btn = document.getElementById("md-btn");
// Get the <span> element that closes the modal
var span = document.getElementsByClassName("close")[0];
var googleBtn = document.querySelector("#google-signin");

if (!googleBtn) {
  console.error("Google sign-in button not found!");
} else {
  console.log("Google sign-in button found and ready");
}

btn.onclick = function () {
  modal.style.visibility = "visible";
};

span.onclick = function () {
  modal.style.visibility = "hidden";
};

window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.visibility = "hidden";
  }
};

googleBtn.addEventListener("click", async () => {
  console.log("Google sign-in button clicked");
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.addScope("email");
  provider.addScope("profile");

  try {
    console.log("Starting Google sign-in popup...");
    const result = await firebase.auth().signInWithPopup(provider);
    console.log("Google sign-in successful:", result);

    const idToken = await result.user.getIdToken();
    console.log("Got ID token from Firebase");

    console.log("Sending token to backend...");
    const response = await fetch("http://2.59.135.31:3000/api/auth/google", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
      Swal.fire({
        title: "Error",
        text: "Authentication failed",
        icon: "error",
      });
      throw new Error(
        `Authentication failed: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log("Backend authentication successful:", data);

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    modal.style.visibility = "hidden";

    updateUIForLoggedInUser(data.user);
    Swal.fire({
      title: "Success",
      text: "Sign in successful",
      icon: "success",
    });
  } catch (error) {
    console.error("Error during sign in:", error);
    alert(`Failed to sign in: ${error.message}`);
  }
});

function updateUIForLoggedInUser(user) {
  console.log("Updating UI for logged in user:", user);
  const signInBtn = document.getElementById("md-btn");
  signInBtn.textContent = "Sign out";
  signInBtn.onclick = signOut;
}

async function signOut() {
  try {
    console.log("Signing out...");
    await firebase.auth().signOut();
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    const signInBtn = document.getElementById("md-btn");
    signInBtn.textContent = "Sign in";
    signInBtn.onclick = function () {
      modal.style.visibility = "visible";
    };
    console.log("Sign out successful");
    Swal.fire({
      title: "Success",
      text: "Sign out successful",
      icon: "success",
    });
  } catch (error) {
    Swal.fire({
      title: "Error",
      text: "Sign out failed",
      icon: "error",
    });
    console.error("Error signing out:", error);
    alert("Failed to sign out. Please try again.");
  }
}
window.addEventListener("DOMContentLoaded", () => {
  console.log("Checking for existing user session...");
  const user = JSON.parse(localStorage.getItem("user"));
  if (user) {
    console.log("Found existing user session:", user);
    updateUIForLoggedInUser(user);
  }
});
