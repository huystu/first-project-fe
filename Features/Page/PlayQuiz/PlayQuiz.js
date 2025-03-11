document.addEventListener("DOMContentLoaded", () => {
  // Game state
  let currentQuiz = null;
  let currentQuestionIndex = 0;
  let score = 0;
  let timeLeft = 10;
  let timerInterval = null;
  let isAnswerSelected = false;
  let currentSession = null;

  // DOM Elements
  const quizTitle = document.getElementById("quizTitle");
  const questionCounter = document.getElementById("questionCounter");
  const totalScore = document.getElementById("totalScore");
  const timer = document.getElementById("timer");
  const questionText = document.getElementById("questionText");
  const statusMessage = document.getElementById("statusMessage");
  const optionButtons = document.querySelectorAll(".option-btn");
  const backHomeBtn = document.getElementById("backHomeBtn");
  const loadingOverlay = document.getElementById("loadingOverlay");

  // Show loading overlay and disable interactions
  function showLoading() {
    loadingOverlay.classList.add("active");
    document.querySelector(".quiz-container").classList.add("loading-active"); // Target container instead
  }
  
  function hideLoading() {
    loadingOverlay.classList.remove("active");
    document.querySelector(".quiz-container").classList.remove("loading-active");
  }

  // Initialize quiz
  async function initializeQuiz() {
    showLoading(); // Show overlay and disable interactions immediately

    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get("id");

    if (!quizId) {
      hideLoading();
      showError("No quiz ID provided");
      return;
    }

    try {
      // Fetch quiz data
      const quizResponse = await fetch(
        `http://2.59.135.31:3000/api/quizzes/${quizId}`
      );
      if (!quizResponse.ok) throw new Error("Failed to fetch quiz");
      currentQuiz = await quizResponse.json();

      // Fetch existing session
      const token = localStorage.getItem("token");
      const sessionResponse = await fetch(
        `http://2.59.135.31:3000/api/sessions/active/${quizId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (sessionResponse.ok) {
        currentSession = await sessionResponse.json();

        if (currentSession && currentSession.status === "in-progress") {
          // Ask user if they want to continue
          hideLoading(); // Hide before Swal to allow interaction with dialog
          const result = await Swal.fire({
            title: "Continue Previous Session?",
            text: `You have an unfinished session (Question ${
              currentSession.questionIndex + 1
            }/${currentQuiz.questions.length}). Would you like to continue?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Yes, continue",
            cancelButtonText: "No, start over",
          });

          if (result.isConfirmed) {
            // Continue from previous session
            currentQuestionIndex = currentSession.questionIndex;
            score = currentSession.score;
          } else {
            // Start new session
            await createNewSession(quizId);
          }
        } else {
          // Create new session if no active session exists
          await createNewSession(quizId);
        }
      } else {
        // Create new session if failed to fetch
        await createNewSession(quizId);
      }

      quizTitle.textContent = currentQuiz.title;
      hideLoading(); // Hide overlay and enable interactions only when fully loaded
      startQuiz();
    } catch (error) {
      hideLoading();
      showError("Failed to load quiz");
      console.error(error);
    }
  }

  // Create new session
  async function createNewSession(quizId) {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://2.59.135.31:3000/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          quizSetId: quizId,
          status: "in-progress",
        }),
      });

      if (!response.ok) throw new Error("Failed to create session");
      currentSession = await response.json();
    } catch (error) {
      console.error("Error creating session:", error);
    }
  }

  // Update session after each answer
  async function updateSession(selectedAnswer, isCorrect) {
    if (!currentSession) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://2.59.135.31:3000/api/sessions/${currentSession._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            questionAnswer: [
              ...currentSession.questionAnswer,
              {
                questionIndex: currentQuestionIndex,
                selectedAnswer,
                isCorrect,
                timeLeft,
              },
            ],
            score,
            questionIndex: currentQuestionIndex + 1,
            lastTimePlay: new Date(),
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to update session");
      currentSession = await response.json();
    } catch (error) {
      console.error("Error updating session:", error);
    }
  }

  // End session
  async function endSession() {
    if (!currentSession) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://2.59.135.31:3000/api/sessions/${currentSession._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: "ended",
            dateFinished: new Date(),
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to end session");
    } catch (error) {
      console.error("Error ending session:", error);
    }
  }

  // Start quiz
  function startQuiz() {
    updateScore();
    displayQuestion();
  }

  // Display current question
  function displayQuestion() {
    if (!currentQuiz || currentQuestionIndex >= currentQuiz.questions.length) {
      endQuiz();
      return;
    }

    const question = currentQuiz.questions[currentQuestionIndex];
    questionCounter.textContent = `Question: ${currentQuestionIndex + 1}/${
      currentQuiz.questions.length
    }`;
    questionText.textContent = question.question;

    // Update option texts
    document.querySelector("#optionA .option-text").textContent =
      question.answer_a;
    document.querySelector("#optionB .option-text").textContent =
      question.answer_b;
    document.querySelector("#optionC .option-text").textContent =
      question.answer_c;
    document.querySelector("#optionD .option-text").textContent =
      question.answer_d;

    // Reset options state
    optionButtons.forEach((button) => {
      button.disabled = false;
      button.classList.remove("correct", "wrong");
    });

    // Reset status message
    statusMessage.textContent = "";
    statusMessage.className = "status-message";

    // Reset and start timer
    isAnswerSelected = false;
    startTimer();
  }

  // Timer functionality
  function startTimer() {
    timeLeft = 10;
    updateTimer();

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timeLeft--;
      updateTimer();

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        handleTimeout();
      }
    }, 1000);
  }

  function updateTimer() {
    timer.textContent = timeLeft;
    timer.className = "timer" + (timeLeft <= 3 ? " warning" : "");
  }

  // Handle answer selection
  async function handleAnswerSelection(selectedOption) {
    if (isAnswerSelected) return;
    isAnswerSelected = true;

    clearInterval(timerInterval);
    const question = currentQuiz.questions[currentQuestionIndex];
    const isCorrect = selectedOption === question.correct_answer;

    // Calculate score
    if (isCorrect) {
      const timeBonus = timeLeft * 10;
      const questionScore = 100 + timeBonus;
      score += questionScore;
      updateScore();
    }

    // Show correct/wrong animations
    optionButtons.forEach((button) => {
      const choice = button.dataset.choice;
      if (choice === question.correct_answer) {
        button.classList.add("correct");
      } else if (choice === selectedOption && !isCorrect) {
        button.classList.add("wrong");
      }
      button.disabled = true;
    });

    // Show status message
    showStatus(isCorrect, timeLeft);

    // Update session with answer
    await updateSession(selectedOption, isCorrect);

    // Next question after delay
    setTimeout(() => {
      currentQuestionIndex++;
      displayQuestion();
    }, 2000);
  }

  // Handle timeout
  function handleTimeout() {
    if (isAnswerSelected) return;
    isAnswerSelected = true;

    const question = currentQuiz.questions[currentQuestionIndex];

    // Show correct answer
    optionButtons.forEach((button) => {
      if (button.dataset.choice === question.correct_answer) {
        button.classList.add("correct");
      }
      button.disabled = true;
    });

    showStatus(false, 0);

    setTimeout(() => {
      currentQuestionIndex++;
      displayQuestion();
    }, 2000);
  }

  // Update score display
  function updateScore() {
    totalScore.textContent = `Score: ${score}`;
  }

  // Show status message
  function showStatus(isCorrect, timeLeft) {
    statusMessage.className = `status-message show ${
      isCorrect ? "correct" : "wrong"
    }`;
    if (isCorrect) {
      const timeBonus = timeLeft * 10;
      statusMessage.textContent = `Correct! +${
        100 + timeBonus
      } points (Time bonus: +${timeBonus})`;
    } else {
      statusMessage.textContent =
        "Wrong answer! The correct answer is highlighted.";
    }
  }

  // End quiz
  async function endQuiz() {
    clearInterval(timerInterval);
    await endSession();

    // Redirect to leaderboard
    window.location.href = `../LeaderBoard/LeaderBoard.html?id=${currentQuiz._id}&sessionId=${currentSession._id}`;
  }

  // Show error message
  function showError(message) {
    Swal.fire({
      title: "Error",
      text: message,
      icon: "error",
      confirmButtonText: "Return to Home",
    }).then(() => {
      window.location.href = "../HomePage/HomPage.html";
    });
  }

  // Back to home handler
  async function handleBackHome() {
    // Pause the timer
    clearInterval(timerInterval);

    Swal.fire({
      title: "Leave Quiz?",
      text: "Your progress will be saved. You can continue later. Are you sure you want to return to home?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, leave quiz",
      cancelButtonText: "No, continue quiz",
    }).then((result) => {
      if (result.isConfirmed) {
        window.location.href = "../HomePage/HomPage.html";
      } else {
        // Resume timer if user stays
        if (!isAnswerSelected) {
          startTimer();
        }
      }
    });
  }

  // Event listeners
  optionButtons.forEach((button) => {
    button.addEventListener("click", () =>
      handleAnswerSelection(button.dataset.choice)
    );
  });

  backHomeBtn.addEventListener("click", handleBackHome);

  // Start the quiz
  initializeQuiz();
});