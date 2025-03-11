document.addEventListener("DOMContentLoaded", () => {
  const generateBtn = document.getElementById("generateBtn");
  const playNowBtn = document.getElementById("playNowBtn");
  const topicInput = document.getElementById("topic");
  const numQuestionsInput = document.getElementById("numQuestions");
  const languageSelect = document.getElementById("language");
  const container = document.querySelector(".container");

  generateBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const quizData = {
      topic: topicInput.value.trim(),
      numberOfQuestions: parseInt(numQuestionsInput.value),
      language: languageSelect.value,
    };

    if (!quizData.topic) {
      alert("Please enter a quiz topic");
      return;
    }

    if (quizData.numberOfQuestions < 1 || quizData.numberOfQuestions > 20) {
      alert("Number of questions must be between 1 and 20");
      return;
    }

    container.classList.add("loading");
    document.querySelector(".loading-text").textContent =
      "Generating your quiz... 🚀";

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://2.59.135.31:3000/api/quizzes/generate",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(quizData),
        }
      );

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();

      if (!result.quizSet || !result.quizSet.id) {
        throw new Error("Unexpected API response format");
      }

      container.classList.remove("loading");
      container.classList.add("completed");

      localStorage.setItem("generatedQuizId", result.quizSet.id);

      playNowBtn.style.display = "block";
      playNowBtn.onclick = () => {
        window.location.href = `/Features/Page/PlayQuiz/PlayQuiz.html?id=${result.quizSet.id}`;
      };
    } catch (error) {
      console.error("Error generating quiz:", error);
      alert("Failed to generate quiz. Please try again.");
      container.classList.remove("loading");
    }
  });

  numQuestionsInput.addEventListener("input", () => {
    const value = parseInt(numQuestionsInput.value);
    if (value < 1) numQuestionsInput.value = 1;
    if (value > 20) numQuestionsInput.value = 20;
  });
});
