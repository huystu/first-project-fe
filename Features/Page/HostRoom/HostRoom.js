document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const roomCodeSpan = document.getElementById("roomCode");
  const qrCodeDiv = document.getElementById("qrCode");
  const quizSelect = document.getElementById("quizSelect");
  const timeSelect = document.getElementById("timeSelect");
  const playersList = document.getElementById("playersList");
  const startBtn = document.getElementById("startBtn");
  const backBtn = document.getElementById("backBtn");

  // Game elements
  const gameContainer = document.createElement("div");
  gameContainer.className = "game-container";
  gameContainer.style.display = "none";
  gameContainer.innerHTML = `
    <div class="game-header">
      <div class="question-counter">
        Question <span id="currentQuestion">1</span>/<span id="totalQuestions">10</span>
      </div>
      <div class="timer"><span id="timeLeft">30</span>s</div>
    </div>
    <div class="question-container">
      <h2 id="questionText">Waiting for question...</h2>
      <div class="answers-grid">
        <button class="answer-btn" data-answer="A"><span></span></button>
        <button class="answer-btn" data-answer="B"><span></span></button>
        <button class="answer-btn" data-answer="C"><span></span></button>
        <button class="answer-btn" data-answer="D"><span></span></button>
      </div>
    </div>
  `;
  document.querySelector(".container").appendChild(gameContainer);

  const timeLeftSpan = document.getElementById("timeLeft");
  const currentQuestionSpan = document.getElementById("currentQuestion");
  const totalQuestionsSpan = document.getElementById("totalQuestions");
  const questionText = document.getElementById("questionText");
  const answerButtons = document.querySelectorAll(".answer-btn");

  // Game state
  let selectedAnswer = null;
  let isAnswerSubmitted = false;
  let timer = null;
  let currentQuestionIndex = 0;
  let totalQuestions = 0;
  let questions = [];
  let isGameStarted = false;
  let currentQuizData = null;

  // Socket connection with reconnection options
  const socket = io("http://devplus.ipaine.com", {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    autoConnect: true,
  });

  let roomId = null;

  // Socket connection event handlers
  socket.on("connect", () => {
    console.log("Connected to server");
    if (roomId) {
      if (isGameStarted) {
        socket.emit("rejoin_game", { roomId, mode: "host" });
      } else {
        socket.emit("rejoin_room", { roomId });
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from server");
  });

  socket.on("connect_error", (error) => {
    console.error("Connection error:", error);
    Swal.fire({
      icon: "error",
      title: "Connection Error",
      text: "Failed to connect to server. Please try again.",
    });
  });

  socket.on(
    "game_started",
    ({ question, questionNumber, totalQuestions, timeLeft }) => {
      console.log("Received game_started event:", {
        question,
        questionNumber,
        totalQuestions,
        timeLeft,
      });
      isGameStarted = true;

      // Hide room setup elements
      document.querySelector(".room-info").style.display = "none";
      document.querySelector(".host-controls").style.display = "none";
      document.querySelector(".players-section").style.display = "none";
      document.querySelector(".controls").style.display = "none";

      // Show game container
      gameContainer.style.display = "block";

      // Update UI
      totalQuestionsSpan.textContent = totalQuestions;
      currentQuestionSpan.textContent = questionNumber;

      // Display first question
      displayQuestion(question, timeLeft);
    }
  );

  socket.on("show_answer", ({ correctAnswer, answers, leaderboard }) => {
    clearInterval(timer);

    // Show correct answer
    answerButtons.forEach((btn) => {
      const answer = btn.dataset.answer;
      if (answer === correctAnswer) {
        btn.classList.add("correct");
      } else if (
        answer === selectedAnswer &&
        selectedAnswer !== correctAnswer
      ) {
        btn.classList.add("incorrect");
      }
      btn.disabled = true;
    });

    // Find host's result from leaderboard
    const hostPlayer = leaderboard.find(
      (p) => p.playerName === localStorage.getItem("displayName")
    );
    const pointsEarned = hostPlayer ? hostPlayer.pointsEarned : 0;

    // First show the answer result for host
    let resultTitle = "Time's Up!";
    let resultText = "You didn't answer in time.";
    let resultIcon = "warning";

    if (selectedAnswer) {
      if (selectedAnswer === correctAnswer) {
        resultTitle = "Correct!";
        resultText = `You earned ${pointsEarned} points!`;
        resultIcon = "success";
      } else {
        resultTitle = "Wrong Answer";
        resultText = "Better luck next time!";
        resultIcon = "error";
      }
    }

    Swal.fire({
      icon: resultIcon,
      title: resultTitle,
      text: resultText,
      timer: 2000,
      showConfirmButton: false,
    }).then(() => {
      // Then show the leaderboard
      Swal.fire({
        title: "Question Results",
        html: generateLeaderboardHTML(leaderboard),
        customClass: {
          popup: "leaderboard-modal",
        },
        showConfirmButton: false,
        timer: 5000,
        timerProgressBar: true,
        allowOutsideClick: false,
      });
    });
  });

  socket.on(
    "next_question",
    ({ question, questionNumber, totalQuestions, timeLeft, leaderboard }) => {
      console.log("Received next_question event:", {
        question,
        questionNumber,
        totalQuestions,
        timeLeft,
        leaderboard,
      });

      // Reset game state
      selectedAnswer = null;
      isAnswerSubmitted = false;

      // Update question counter
      currentQuestionSpan.textContent = questionNumber;
      totalQuestionsSpan.textContent = totalQuestions;

      // Display next question
      displayQuestion(question, timeLeft);

      // Clear any existing timer
      clearInterval(timer);

      // Start new timer
      startTimer(timeLeft);
    }
  );

  socket.on("answer_result", (result) => {
    if (!result) return;

    // Don't show result immediately, just store it
    const { correct_answer, is_correct, points } = result;
    if (is_correct) {
      selectedAnswer = correct_answer;
    }
    isAnswerSubmitted = true;

    // Disable all buttons after submitting
    answerButtons.forEach((btn) => {
      btn.disabled = true;
      if (btn.dataset.answer === selectedAnswer) {
        btn.classList.add("selected");
      }
    });

    // Show waiting message
    Swal.fire({
      title: "Answer Submitted",
      text: "Waiting for all players...",
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  });

  socket.on("game_ended", ({ leaderboard }) => {
    clearInterval(timer);
    showGameResults(leaderboard);
  });

  socket.on("time_update", ({ timeLeft }) => {
    timeLeftSpan.textContent = timeLeft;
  });

  // Initialize host room
  async function initializeRoom() {
    try {
      // Get user's display name from localStorage
      const displayName = localStorage.getItem("displayName");
      if (!displayName) {
        const { value: name } = await Swal.fire({
          title: "Enter your display name",
          input: "text",
          inputPlaceholder: "Your name",
          allowOutsideClick: false,
          inputValidator: (value) => {
            if (!value) {
              return "You need to enter a name!";
            }
          },
        });

        if (name) {
          localStorage.setItem("displayName", name);
        }
      }

      // Create room with host as first player
      socket.emit("create_room", {
        playerName: localStorage.getItem("displayName"),
        isHost: true,
      });

      try {
        // Load quiz sets
        const token = localStorage.getItem("token");
        const response = await fetch(
          "https://devplus.ipaine.com/api/quizzes/all",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseText = await response.text();
        console.log("Server response:", responseText); // Debug log

        let quizSets;
        try {
          quizSets = JSON.parse(responseText);
        } catch (e) {
          console.error("Failed to parse response:", responseText);
          console.log("Using default quiz set for testing");
          // Provide a default quiz set for testing
          quizSets = [
            {
              _id: "test1",
              title: "Test Quiz 1",
            },
            {
              _id: "test2",
              title: "Test Quiz 2",
            },
          ];
        }

        // Populate quiz select
        quizSelect.innerHTML =
          '<option value="">Select a quiz set...</option>' +
          quizSets
            .map((quiz) => `<option value="${quiz._id}">${quiz.title}</option>`)
            .join("");
      } catch (error) {
        console.error("Error fetching quiz sets:", error);
        // Use default quiz set on error
        quizSelect.innerHTML =
          '<option value="">Select a quiz set...</option>' +
          '<option value="test1">Test Quiz 1</option>' +
          '<option value="test2">Test Quiz 2</option>';
      }
    } catch (error) {
      console.error("Error initializing room:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to initialize room. Please try again.",
      });
    }
  }

  // Socket event handlers
  socket.on("room_created", ({ roomId: newRoomId, room }) => {
    roomId = newRoomId;
    // Format room code to be displayed with spaces between pairs
    const formattedRoomCode = roomId.match(/.{1,2}/g).join(" ");
    roomCodeSpan.textContent = formattedRoomCode;

    // Generate QR code with relative path
    const currentPath = window.location.pathname;
    const basePath = currentPath.substring(0, currentPath.lastIndexOf("/"));
    const roomUrl = `${window.location.origin}${basePath}/../PlayerRoom/PlayerRoom.html?roomId=${roomId}`;

    try {
      // Create QR code using a div instead of canvas
      const qrContainer = document.createElement("div");
      qrCodeDiv.innerHTML = ""; // Clear previous content
      qrCodeDiv.appendChild(qrContainer);

      if (typeof QRCode === "undefined") {
        // Fallback if QRCode is not loaded
        console.error("QRCode library not loaded, displaying URL instead");
        qrContainer.innerHTML = `
          <div style="padding: 20px; text-align: center;">
            <p style="margin-bottom: 10px;">Share this code with friends:</p>
            <h2 style="font-size: 2em; margin: 10px 0; letter-spacing: 3px;">${formattedRoomCode}</h2>
            <p style="margin-bottom: 10px;">Or use this link:</p>
            <a href="${roomUrl}" target="_blank">${roomUrl}</a>
          </div>
        `;
        return;
      }

      // Add room code display above QR code
      const roomCodeDisplay = document.createElement("div");
      roomCodeDisplay.innerHTML = `
        <h2 style="font-size: 2em; margin: 10px 0; letter-spacing: 3px;">${formattedRoomCode}</h2>
      `;
      qrCodeDiv.appendChild(roomCodeDisplay);

      // Use a more reliable QR code generation method
      new QRCode(qrContainer, {
        text: roomUrl,
        width: 200,
        height: 200,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H,
      });
    } catch (error) {
      console.error("Error generating QR code:", error);
      // Fallback display
      qrCodeDiv.innerHTML = `
        <div style="padding: 20px; text-align: center;">
          <p style="margin-bottom: 10px;">Share this code with friends:</p>
          <h2 style="font-size: 2em; margin: 10px 0; letter-spacing: 3px;">${formattedRoomCode}</h2>
          <p style="margin-bottom: 10px;">Or use this link:</p>
          <a href="${roomUrl}" target="_blank">${roomUrl}</a>
        </div>
      `;
    }
  });

  socket.on("player_joined", ({ playerId, playerName, players, isHost }) => {
    updatePlayersList(players);

    // Only show toast for other players joining, not for host
    if (!isHost) {
      Swal.fire({
        icon: "success",
        title: "New Player Joined",
        text: `${playerName} has joined the room!`,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
    }
  });

  socket.on("player_left", ({ playerId, players }) => {
    updatePlayersList(players);
  });

  socket.on("error", ({ message }) => {
    Swal.fire({
      icon: "error",
      title: "Error",
      text: message,
      allowOutsideClick: false,
    }).then(() => {
      if (message === "Room not found") {
        window.location.href = "../HomePage/HomPage.html";
      }
    });
  });

  // Helper functions
  function updatePlayersList(players) {
    playersList.innerHTML = "";
    players.forEach((player) => {
      const playerCard = document.createElement("div");
      playerCard.className = "player-card";

      const avatar = document.createElement("div");
      avatar.className = "player-avatar";
      avatar.textContent = player.name.charAt(0).toUpperCase();

      const name = document.createElement("span");
      name.textContent = player.name;

      playerCard.appendChild(avatar);
      playerCard.appendChild(name);
      playersList.appendChild(playerCard);
    });

    // Enable start button if we have quiz selected and at least one player
    startBtn.disabled = !quizSelect.value || players.length < 1;
  }

  // Event listeners
  quizSelect.addEventListener("change", async () => {
    const players = Array.from(playersList.children);
    startBtn.disabled = !quizSelect.value || players.length < 1;

    if (quizSelect.value) {
      try {
        console.log("Fetching quiz data for ID:", quizSelect.value);
        // Fetch full quiz data
        const response = await fetch(
          `http://2.59.135.31:3000/api/quizzes/${quizSelect.value}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch quiz data");
        }
        const quizData = await response.json();
        console.log("Fetched quiz data:", quizData);

        // Store quiz data
        currentQuizData = quizData;

        // Send full quiz data to server
        console.log("Sending quiz data to server for room:", roomId);
        socket.emit("set_quiz", {
          roomId,
          quizSet: quizData,
        });
      } catch (error) {
        console.error("Error fetching quiz:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to load quiz data. Please try again.",
        });
        quizSelect.value = "";
        startBtn.disabled = true;
      }
    }
  });

  timeSelect.addEventListener("change", () => {
    socket.emit("set_time", {
      roomId,
      seconds: parseInt(timeSelect.value),
    });
  });

  startBtn.addEventListener("click", () => {
    const selectedQuizId = quizSelect.value;
    if (!selectedQuizId) {
      Swal.fire({
        icon: "error",
        title: "No Quiz Selected",
        text: "Please select a quiz before starting the game",
      });
      return;
    }

    if (!currentQuizData) {
      console.error("No quiz data available");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Quiz data not loaded. Please try selecting the quiz again.",
      });
      return;
    }

    const timePerQuestion = parseInt(timeSelect.value) || 30;
    console.log("Starting game with:", {
      roomId,
      quiz: currentQuizData,
      timePerQuestion,
    });

    socket.emit("start_game", {
      roomId,
      quiz: currentQuizData,
      timePerQuestion,
    });
  });

  backBtn.addEventListener("click", () => {
    if (roomId) {
      socket.emit("leave_room", { roomId });
    }
    window.location.href = "../HomePage/HomPage.html";
  });

  // Event listeners for answer buttons
  answerButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (isAnswerSubmitted) return;

      // Remove previous selection
      answerButtons.forEach((b) => b.classList.remove("selected"));

      // Add new selection
      btn.classList.add("selected");
      selectedAnswer = btn.dataset.answer;

      // Submit answer
      submitAnswer(selectedAnswer);
    });
  });

  function submitAnswer(answer) {
    if (isAnswerSubmitted) return;
    isAnswerSubmitted = true;

    socket.emit("submit_answer", {
      roomId,
      answer,
    });

    // Disable all buttons after submitting
    answerButtons.forEach((btn) => (btn.disabled = true));
  }

  function displayQuestion(question, timeLeft) {
    console.log("Displaying question:", { question, timeLeft });

    if (!question) {
      console.error("No question data provided to display");
      return;
    }

    // Reset state
    selectedAnswer = null;
    isAnswerSubmitted = false;
    answerButtons.forEach((btn) => {
      btn.classList.remove("selected", "correct", "incorrect");
      btn.disabled = false;
      btn.style.opacity = "1";
    });

    // Display question
    questionText.textContent = question.text;
    answerButtons.forEach((btn, index) => {
      const span = btn.querySelector("span");
      span.textContent = question.options[index];
      btn.disabled = false;
    });

    // Update timer display
    timeLeftSpan.textContent = timeLeft;
  }

  function startTimer(seconds) {
    clearInterval(timer);
    timeLeftSpan.textContent = seconds;

    timer = setInterval(() => {
      const timeLeft = parseInt(timeLeftSpan.textContent) - 1;
      timeLeftSpan.textContent = timeLeft;

      if (timeLeft <= 0) {
        clearInterval(timer);
        if (!isAnswerSubmitted) {
          submitAnswer(null);
        }
      }
    }, 1000);
  }

  function showGameResults(leaderboard) {
    const top3Players = leaderboard.slice(0, 3);
    const winner = leaderboard[0];
    const currentPlayer = leaderboard.find(
      (p) => p.playerName === localStorage.getItem("displayName")
    );
    const playerRank =
      leaderboard.findIndex(
        (p) => p.playerName === localStorage.getItem("displayName")
      ) + 1;

    Swal.fire({
      title: "🎉 Game Over! 🎉",
      html: `
        <div class="game-results">
          <div class="top-3-container">
            ${top3Players
              .map(
                (player, index) => `
              <div class="top-player rank-${index + 1}">
                <div class="crown">${index === 0 ? "👑" : ""}</div>
                <div class="player-avatar">${player.playerName[0].toUpperCase()}</div>
                <div class="player-name">${player.playerName}</div>
                <div class="player-score">${player.score} pts</div>
                <div class="rank-label">${
                  index === 0 ? "1st" : index === 1 ? "2nd" : "3rd"
                }</div>
              </div>
            `
              )
              .join("")}
          </div>
          <div class="your-result">
            <h3>Your Result</h3>
            <p>Score: ${currentPlayer.score} pts</p>
            <p>Rank: ${playerRank}${getOrdinalSuffix(playerRank)}</p>
          </div>
          <div class="final-leaderboard">
            <h3>Final Standings</h3>
            ${generateLeaderboardHTML(leaderboard)}
          </div>
        </div>
      `,
      customClass: {
        popup: "game-over-modal",
      },
      confirmButtonText: "Back to Home",
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = "../HomePage/HomPage.html";
      }
    });
  }

  function getOrdinalSuffix(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  }

  function generateLeaderboardHTML(leaderboard) {
    return `
      <div class="leaderboard-container">
        ${leaderboard
          .sort((a, b) => b.score - a.score)
          .map(
            (player, index) => `
            <div class="leaderboard-item ${
              index < 3 ? `rank-${index + 1}` : ""
            }">
              <div class="player-info">
                <span class="rank">#${index + 1}</span>
                <div class="player-avatar">${player.playerName[0].toUpperCase()}</div>
                <span class="player-name">${player.playerName}</span>
              </div>
              <div class="score-info">
                <span class="score">${player.score} pts</span>
                ${
                  player.pointsEarned
                    ? `<span class="points-earned">+${player.pointsEarned}</span>`
                    : ""
                }
              </div>
            </div>
          `
          )
          .join("")}
      </div>
    `;
  }

  function updateLeaderboard(leaderboard) {
    leaderboardList.innerHTML = "";
    leaderboard
      .sort((a, b) => b.score - a.score)
      .forEach((player, index) => {
        const item = document.createElement("div");
        item.className = "leaderboard-item";
        if (index < 3) item.classList.add(`rank-${index + 1}`);

        item.innerHTML = `
          <div class="player-info">
            <div class="rank">${index + 1}</div>
            <div class="player-avatar">${player.playerName
              .charAt(0)
              .toUpperCase()}</div>
            <span class="player-name">${player.playerName}</span>
          </div>
          <div class="score">${player.score}</div>
        `;
        leaderboardList.appendChild(item);
      });
  }

  // Initialize room when page loads
  initializeRoom();
});
