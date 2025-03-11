// Function to fetch and display quizzes
async function displayQuizzes() {
  try {
    const response = await fetch("http://2.59.135.31:3000/api/quizzes/all");
    if (!response.ok) {
      throw new Error("Failed to fetch quizzes");
    }

    const quizSets = await response.json();
    const quizGrid = document.getElementById("quiz-grid");

    // Clear existing content
    quizGrid.innerHTML = `
            <button class="slide-btn prev-btn">&lt;</button>
            <div class="cards-container"></div>
            <button class="slide-btn next-btn">&gt;</button>
        `;

    const cardsContainer = quizGrid.querySelector(".cards-container");

    // Create and append quiz cards
    quizSets.forEach((quizSet) => {
      const quizCard = `
                <div class="quiz-card" data-quiz-id="${quizSet._id}">
                    <div class="quiz-info">
                        <h4>${quizSet.title}</h4>
                        <p class="quiz-description">${
                          quizSet.description || "No description available"
                        }</p>
                        <div class="quiz-meta">
                            <div class="quiz-meta-item">
                                <span>Creator:</span>
                                <span>${
                                  quizSet.creator?.name || "Unknown"
                                }</span>
                            </div>
                            <div class="quiz-meta-item">
                                <span>Questions:</span>
                                <span>${quizSet.questions?.length || 0}</span>
                            </div>
                            <div class="quiz-meta-item">
                                <span>Created:</span>
                                <span>${new Date(
                                  quizSet.createdAt
                                ).toLocaleDateString()}</span>
                            </div>
                            <div class="quiz-meta-item">
                                <span>Plays:</span>
                                <span>${quizSet.playCount || 0}</span>
                            </div>
                        </div>
                    </div>
                    <div class="quiz-actions">
                        <button class="action-btn play-btn" onclick="playQuiz('${
                          quizSet._id
                        }')">Play</button>
                        <button class="action-btn view-btn" onclick="viewQuiz('${
                          quizSet._id
                        }')">View</button>
                    </div>
                </div>
            `;
      cardsContainer.innerHTML += quizCard;
    });

    // Initialize carousel functionality
    let currentPage = 0;
    const cardsPerPage = 5;
    const totalPages = Math.ceil(quizSets.length / cardsPerPage);
    const cards = Array.from(cardsContainer.querySelectorAll(".quiz-card"));

    function updateCarousel() {
      cards.forEach((card, index) => {
        if (
          index >= currentPage * cardsPerPage &&
          index < (currentPage + 1) * cardsPerPage
        ) {
          card.style.display = "block";
        } else {
          card.style.display = "none";
        }
      });
    }

    // Add click handlers for buttons
    const prevBtn = quizGrid.querySelector(".prev-btn");
    const nextBtn = quizGrid.querySelector(".next-btn");

    prevBtn.addEventListener("click", () => {
      if (currentPage > 0) {
        currentPage--;
        updateCarousel();
      }
    });

    nextBtn.addEventListener("click", () => {
      if (currentPage < totalPages - 1) {
        currentPage++;
        updateCarousel();
      }
    });

    // Initial update
    updateCarousel();
  } catch (error) {
    console.error("Error fetching quizzes:", error);
  }
}

// Function to display popular quizzes
async function displayPopularQuizzes() {
  try {
    const response = await fetch("http://2.59.135.31:3000/api/quizzes/all");
    if (!response.ok) {
      throw new Error("Failed to fetch quizzes");
    }

    const quizSets = await response.json();

    // Sort quizzes by playCount in descending order
    const sortedQuizSets = quizSets.sort((a, b) => b.playCount - a.playCount);

    const popularQuizGrid = document.querySelector(
      ".quiz-section:nth-of-type(3) .quiz-grid"
    );

    // Clear existing content
    popularQuizGrid.innerHTML = `
            <button class="slide-btn prev-btn">&lt;</button>
            <div class="cards-container"></div>
            <button class="slide-btn next-btn">&gt;</button>
        `;

    const cardsContainer = popularQuizGrid.querySelector(".cards-container");

    // Create and append quiz cards for popular quizzes
    sortedQuizSets.forEach((quizSet) => {
      const quizCard = `
                <div class="quiz-card" data-quiz-id="${quizSet._id}">
                    <div class="quiz-info">
                        <h4>${quizSet.title}</h4>
                        <div class="quiz-meta">
                            <div class="quiz-meta-item">
                                <span>Creator:</span>
                                <span>${
                                  quizSet.creator?.name || "Unknown"
                                }</span>
                            </div>
                            <div class="quiz-meta-item">
                                <span>Questions:</span>
                                <span>${
                                  quizSet.questions
                                    ? quizSet.questions.length
                                    : 0
                                }</span>
                            </div>
                            <div class="quiz-meta-item">
                                <span>Created:</span>
                                <span>${new Date(
                                  quizSet.createdAt
                                ).toLocaleDateString()}</span>
                            </div>
                            <div class="quiz-meta-item">
                                <span>Plays:</span>
                                <span>${quizSet.playCount || 0}</span>
                            </div>
                        </div>
                    </div>
                    <div class="quiz-actions">
                        <button class="action-btn play-btn" onclick="playQuiz('${
                          quizSet._id
                        }')">Play</button>
                        <button class="action-btn view-btn" onclick="viewQuiz('${
                          quizSet._id
                        }')">View</button>
                    </div>
                </div>
            `;
      cardsContainer.innerHTML += quizCard;
    });

    // Initialize carousel functionality
    let currentPage = 0;
    const cardsPerPage = 5;
    const totalPages = Math.ceil(sortedQuizSets.length / cardsPerPage);
    const cards = Array.from(cardsContainer.querySelectorAll(".quiz-card"));

    function updateCarousel() {
      cards.forEach((card, index) => {
        if (
          index >= currentPage * cardsPerPage &&
          index < (currentPage + 1) * cardsPerPage
        ) {
          card.style.display = "block";
        } else {
          card.style.display = "none";
        }
      });
    }

    // Add click handlers for buttons
    const prevBtn = popularQuizGrid.querySelector(".prev-btn");
    const nextBtn = popularQuizGrid.querySelector(".next-btn");

    prevBtn.addEventListener("click", () => {
      if (currentPage > 0) {
        currentPage--;
        updateCarousel();
      }
    });

    nextBtn.addEventListener("click", () => {
      if (currentPage < totalPages - 1) {
        currentPage++;
        updateCarousel();
      }
    });

    // Initial update
    updateCarousel();
  } catch (error) {
    console.error("Error fetching popular quizzes:", error);
  }
}

// Call both functions when the page loads
document.addEventListener("DOMContentLoaded", () => {
  displayQuizzes();
  displayPopularQuizzes();
});

// Add these new functions at the end of the file
async function viewQuiz(quizId) {
  try {
    const response = await fetch(
      `http://2.59.135.31:3000/api/quizzes/${quizId}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch quiz details");
    }

    const quiz = await response.json();

    // Create modal HTML
    const modalHTML = `
            <div class="quiz-view-modal" id="quizViewModal">
                <div class="quiz-view-content">
                    <div class="quiz-view-header">
                        <h2>${quiz.title}</h2>
                        <button class="quiz-view-close" onclick="closeQuizView()">&times;</button>
                    </div>
                    <div class="quiz-view-description">
                        <p>${quiz.description || "No description available"}</p>
                    </div>
                    <div class="quiz-view-meta">
                        <div class="quiz-view-meta-item">
                            <span class="quiz-view-meta-label">Creator</span>
                            <span class="quiz-view-meta-value">${
                              quiz.creator?.name || "Unknown"
                            }</span>
                        </div>
                        <div class="quiz-view-meta-item">
                            <span class="quiz-view-meta-label">Email</span>
                            <span class="quiz-view-meta-value">${
                              quiz.creator?.email || "N/A"
                            }</span>
                        </div>
                        <div class="quiz-view-meta-item">
                            <span class="quiz-view-meta-label">Created</span>
                            <span class="quiz-view-meta-value">${new Date(
                              quiz.createdAt
                            ).toLocaleDateString()}</span>
                        </div>
                        <div class="quiz-view-meta-item">
                            <span class="quiz-view-meta-label">Total Questions</span>
                            <span class="quiz-view-meta-value">${
                              quiz.questions.length
                            }</span>
                        </div>
                        <div class="quiz-view-meta-item">
                            <span class="quiz-view-meta-label">Total Plays</span>
                            <span class="quiz-view-meta-value">${
                              quiz.playCount || 0
                            }</span>
                        </div>
                    </div>
                    <div class="quiz-questions">
                        ${quiz.questions
                          .map(
                            (question, index) => `
                            <div class="quiz-question">
                                <h3>Question ${index + 1}</h3>
                                <p>${question.question}</p>
                                <div class="quiz-answers">
                                    <div class="answer${
                                      question.correct_answer === "A"
                                        ? " correct"
                                        : ""
                                    }">A. ${question.answer_a}</div>
                                    <div class="answer${
                                      question.correct_answer === "B"
                                        ? " correct"
                                        : ""
                                    }">B. ${question.answer_b}</div>
                                    <div class="answer${
                                      question.correct_answer === "C"
                                        ? " correct"
                                        : ""
                                    }">C. ${question.answer_c}</div>
                                    <div class="answer${
                                      question.correct_answer === "D"
                                        ? " correct"
                                        : ""
                                    }">D. ${question.answer_d}</div>
                                </div>
                                <div class="correct-answer">
                                    Correct Answer: ${question.correct_answer}
                                </div>
                            </div>
                        `
                          )
                          .join("")}
                    </div>
                </div>
            </div>
        `;

    // Add modal to body
    document.body.insertAdjacentHTML("beforeend", modalHTML);

    // Show modal
    const modal = document.getElementById("quizViewModal");
    modal.style.display = "flex";

    // Add click event to close modal when clicking outside
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeQuizView();
      }
    });

    // Add escape key listener
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeQuizView();
      }
    });
  } catch (error) {
    console.error("Error fetching quiz details:", error);
    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to load quiz details",
    });
  }
}

function closeQuizView() {
  const modal = document.getElementById("quizViewModal");
  if (modal) {
    modal.remove();
  }
}

function playQuiz(quizId) {
  // Redirect to the play page with the quiz ID
  window.location.href = `../PlayQuiz/PlayQuiz.html?id=${quizId}`;
}

// Scroll to top functionality
document.addEventListener("DOMContentLoaded", function () {
  const scrollToTopBtn = document.getElementById("scrollToTopBtn");

  // Hiển thị nút khi cuộn xuống 100px
  window.onscroll = function () {
    if (
      document.body.scrollTop > 100 ||
      document.documentElement.scrollTop > 100
    ) {
      scrollToTopBtn.style.display = "flex";
    } else {
      scrollToTopBtn.style.display = "none";
    }
  };

  // Xử lý sự kiện click
  scrollToTopBtn.addEventListener("click", function () {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });
});
