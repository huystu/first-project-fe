document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const roomCodeSpan = document.getElementById("roomCode");
  const quizTitleSpan = document.getElementById("quizTitle");
  const timePerQuestionSpan = document.getElementById("timePerQuestion");
  const playersList = document.getElementById("playersList");
  const backBtn = document.getElementById("backBtn");

  // Game elements
  const gameContainer = document.createElement("div");
  gameContainer.className = "game-container";
  gameContainer.style.display = "none";
  gameContainer.innerHTML = `
    <div class="game-header">
      <div class="timer"><span id="timeLeft">30</span>s</div>
      <div class="question-counter">
        Question <span id="currentQuestion">1</span>/<span id="totalQuestions">10</span>
      </div>
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

  // Socket connection
  const socket = io("https://devplus.ipaine.com", {
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
        socket.emit("rejoin_game", { roomId, mode: "player" });
      } else {
        const displayName = localStorage.getItem("displayName");
        socket.emit("rejoin_room", { roomId, playerName: displayName });
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

  // Get room ID from URL and format it
  const urlParams = new URLSearchParams(window.location.search);
  roomId = urlParams.get("roomId");
  if (roomId) {
    roomId = roomId.trim().toUpperCase().replace(/\s+/g, "");
  }

  if (!roomId || roomId.length !== 6) {
    Swal.fire({
      icon: "error",
      title: "Invalid Room",
      text: "Invalid room code provided",
      allowOutsideClick: false,
    }).then(() => {
      window.location.href = "/";
    });
    return;
  }

  // Format room code for display
  const formattedRoomCode = roomId.match(/.{1,2}/g).join(" ");
  roomCodeSpan.textContent = formattedRoomCode;

  // Initialize player
  async function initializePlayer() {
    try {
      // Get user's display name from localStorage or prompt
      let displayName = localStorage.getItem("displayName");
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
          displayName = name;
          localStorage.setItem("displayName", name);
        }
      }

      // Join room
      socket.emit("join_room", { roomId, playerName: displayName });
    } catch (error) {
      console.error("Error initializing player:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to join room. Please try again.",
      }).then(() => {
        window.location.href = "../HomePage/HomPage.html";
      });
    }
  }

  // Socket event handlers
  socket.on("player_joined", ({ playerId, playerName, players }) => {
    updatePlayersList(players);
  });

  socket.on("player_left", ({ playerId, players }) => {
    updatePlayersList(players);
  });

  socket.on("quiz_set", ({ quizSet }) => {
    quizTitleSpan.textContent = quizSet.title;
  });

  socket.on("time_set", ({ seconds }) => {
    timePerQuestionSpan.textContent = seconds;
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

      // Hide waiting room elements
      document.querySelector(".room-info").style.display = "none";
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

      // Update question counter
      currentQuestionSpan.textContent = questionNumber;

      // Display next question
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

    // Find player's result from leaderboard
    const currentPlayer = leaderboard.find(
      (p) => p.playerName === localStorage.getItem("displayName")
    );
    const pointsEarned = currentPlayer ? currentPlayer.pointsEarned : 0;

    // Show result and leaderboard
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

    // First show the answer result
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

  socket.on("time_update", ({ timeLeft }) => {
    timeLeftSpan.textContent = timeLeft;
  });

  socket.on("answer_result", ({ correct_answer, is_correct, points }) => {
    // Don't show result immediately, just store it
    if (is_correct) {
      selectedAnswer = correct_answer;
    }
  });

  socket.on("game_ended", ({ leaderboard }) => {
    clearInterval(timer);
    showGameResults(leaderboard);
  });

  socket.on("room_closed", () => {
    Swal.fire({
      icon: "info",
      title: "Room Closed",
      text: "The host has left the room",
      allowOutsideClick: false,
    }).then(() => {
      window.location.href = "/";
    });
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
    });

    // Display question
    questionText.textContent = question.text;
    answerButtons[0].querySelector("span").textContent = question.options[0];
    answerButtons[1].querySelector("span").textContent = question.options[1];
    answerButtons[2].querySelector("span").textContent = question.options[2];
    answerButtons[3].querySelector("span").textContent = question.options[3];

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

  function submitAnswer(answer) {
    if (isAnswerSubmitted) return;
    isAnswerSubmitted = true;

    socket.emit("submit_answer", {
      roomId,
      answer,
    });

    // Just disable buttons and show "waiting" state
    answerButtons.forEach((btn) => {
      btn.disabled = true;
      if (btn.dataset.answer === answer) {
        btn.classList.add("selected");
      }
    });

    // Show waiting message
    Swal.fire({
      title: "Answer Submitted",
      text: "Waiting for other players...",
      showConfirmButton: false,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
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
    }).then(() => {
      window.location.href = "../HomePage/HomPage.html";
    });
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

  function getOrdinalSuffix(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  }

  // Event listeners
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

  // Initialize player when page loads
  initializePlayer();
});
