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

    async function loadQuiz() {
        try {
            const response = await fetch(`http://2.59.135.31:3000/api/quizzes/${quizId}`);
            if (!response.ok) throw new Error("Quiz not found.");
            quizData = await response.json();
            document.getElementById("quizTitle").innerText = quizData.title || "Untitled Quiz";
            displayQuestion();
        } catch (error) {
            console.error("Error loading quiz:", error);
            alert("Failed to load quiz.");
        }
    }

    function displayQuestion() {
        if (!quizData || currentQuestionIndex >= quizData.questions.length) {
            alert("Quiz finished!");
            return;
        }
        
        const question = quizData.questions[currentQuestionIndex];
        document.getElementById("questionNumber").innerText = `Question: ${currentQuestionIndex + 1}/${quizData.questions.length}`;
        document.getElementById("questionText").innerText = question.question;
        document.getElementById("optionA").innerText = `A: ${question.answer_a}`;
        document.getElementById("optionB").innerText = `B: ${question.answer_b}`;
        document.getElementById("optionC").innerText = `C: ${question.answer_c}`;
        document.getElementById("optionD").innerText = `D: ${question.answer_d}`;

        startTimer();
    }

    function startTimer() {
        let timeLeft = 10;
        document.getElementById("timer").innerText = timeLeft;
        
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timeLeft--;
            document.getElementById("timer").innerText = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                nextQuestion();
            }
        }, 1000);
    }

    function nextQuestion() {
        currentQuestionIndex++;
        displayQuestion();
    }

    document.querySelectorAll(".option").forEach(button => {
        button.addEventListener("click", () => {
            clearInterval(timerInterval);
            nextQuestion();
        });
    });

    loadQuiz();
});