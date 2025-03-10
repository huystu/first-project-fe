document.addEventListener("DOMContentLoaded", async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const quizId = urlParams.get("id");

  if (!quizId) {
    alert("No quiz ID provided.");
    return;
  }

  let currentQuestionIndex = 0;
  let quizData = null;
  let timerInterval;
  let timeoutNextQuestion;
  let score = 0;
  let timeLeft = 10;

  async function loadQuiz() {
    try {
      const response = await fetch(
        `http://2.59.135.31:3000/api/quizzes/${quizId}`
      );
      if (!response.ok) throw new Error("Quiz not found.");
      quizData = await response.json();
      document.getElementById("quizTitle").innerText =
        quizData.title || "Untitled Quiz";
      displayQuestion();
    } catch (error) {
      console.error("Error loading quiz:", error);
      alert("Failed to load quiz.");
    }
  }

  function displayQuestion() {
    if (!quizData || currentQuestionIndex >= quizData.questions.length) {
      alert(`Quiz finished! 🎉 Tổng điểm của bạn: ${score}`);
      return;
    }

    const question = quizData.questions[currentQuestionIndex];

    document.getElementById("questionNumber").innerText = `Câu: ${
      currentQuestionIndex + 1
    }/${quizData.questions.length}`;
    document.getElementById("questionText").innerText = question.question;

    document.getElementById("optionA").innerText = `A: ${question.answer_a}`;
    document.getElementById("optionB").innerText = `B: ${question.answer_b}`;
    document.getElementById("optionC").innerText = `C: ${question.answer_c}`;
    document.getElementById("optionD").innerText = `D: ${question.answer_d}`;

    // Reset trạng thái đáp án
    document.querySelectorAll(".option").forEach((button) => {
      button.classList.remove("correct", "chosen-wrong");
      button.disabled = false;
    });

    document.getElementById("status").innerText = "";
    document.getElementById("status").style.display = "none";

    startTimer();
  }

  function startTimer() {
    timeLeft = 10;
    document.getElementById("timer").innerText = timeLeft;

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timeLeft--;
      document.getElementById("timer").innerText = timeLeft;

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        document.getElementById("status").innerText =
          "⏳ Hết giờ! Đang chuyển sang câu tiếp theo...";
        document.getElementById("status").style.display = "block";

        timeoutNextQuestion = setTimeout(() => {
          nextQuestion();
        }, 3000);
      }
    }, 1000);
  }

  function nextQuestion() {
    currentQuestionIndex++;
    displayQuestion();
  }

  document.querySelectorAll(".option").forEach((button) => {
    button.addEventListener("click", (event) => {
      clearInterval(timerInterval);
      clearTimeout(timeoutNextQuestion); // Ngăn chuyển câu tự động nếu đã chọn đáp án

      const selectedAnswer = event.target.dataset.choice;
      const correctAnswer =
        quizData.questions[currentQuestionIndex].correct_answer;

      document.querySelectorAll(".option").forEach((btn) => {
        btn.disabled = true; // Vô hiệu hóa tất cả nút sau khi chọn
        if (btn.dataset.choice === correctAnswer) {
          btn.classList.add("correct");
          btn.innerText += " ✅"; // Thêm dấu tích cho đáp án đúng
        }
      });

      if (selectedAnswer === correctAnswer) {
        let pointsEarned = 50 + timeLeft * 5; // Càng nhanh điểm càng cao (tối đa 100)
        score += pointsEarned;
        document.getElementById(
          "status"
        ).innerText = `✅ Chính xác! +${pointsEarned} điểm! 🏆 (Tổng: ${score})`;
      } else {
        event.target.classList.add("chosen-wrong");
        event.target.innerText += " ❌"; // Chỉ hiển thị sai cho câu đã chọn
        document.getElementById(
          "status"
        ).innerText = `❌ Sai rồi! Đáp án đúng là ${correctAnswer}. (Tổng: ${score})`;
      }

      document.getElementById("status").style.display = "block";

      setTimeout(() => {
        nextQuestion();
      }, 3000);
    });
  });

  loadQuiz();
});
