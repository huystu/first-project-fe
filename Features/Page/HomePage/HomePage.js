// Function to fetch and display quizzes
async function displayQuizzes() {
    try {
        const response = await fetch('http://2.59.135.31:3000/api/quizzes/all');
        if (!response.ok) {
            throw new Error('Failed to fetch quizzes');
        }
        
        const quizSets = await response.json();
        const quizGrid = document.getElementById('quiz-grid');
        
        // Clear existing content
        quizGrid.innerHTML = `
            <button class="slide-btn prev-btn">&lt;</button>
            <div class="cards-container"></div>
            <button class="slide-btn next-btn">&gt;</button>
        `;

        const cardsContainer = quizGrid.querySelector('.cards-container');
        
        // Create and append quiz cards
        quizSets.forEach(quizSet => {
            const quizCard = `
                <div class="quiz-card">
                    <div class="quiz-image"></div>
                    <div class="quiz-info">
                        <h4>${quizSet.title}</h4>
                        <div class="quiz-meta">
                            <span class="author">Creator: ${quizSet._id}</span>
                        </div>
                    </div>
                </div>
            `;
            cardsContainer.innerHTML += quizCard;
        });

        // Initialize carousel functionality
        let currentPage = 0;
        const cardsPerPage = 5;
        const totalPages = Math.ceil(quizSets.length / cardsPerPage);
        const cards = Array.from(cardsContainer.querySelectorAll('.quiz-card'));

        function updateCarousel() {
            cards.forEach((card, index) => {
                if (index >= currentPage * cardsPerPage && index < (currentPage + 1) * cardsPerPage) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        }

        // Add click handlers for buttons
        const prevBtn = quizGrid.querySelector('.prev-btn');
        const nextBtn = quizGrid.querySelector('.next-btn');

        prevBtn.addEventListener('click', () => {
            if (currentPage > 0) {
                currentPage--;
                updateCarousel();
            }
        });

        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages - 1) {
                currentPage++;
                updateCarousel();
            }
        });

        // Initial update
        updateCarousel();

    } catch (error) {
        console.error('Error fetching quizzes:', error);
    }
}

// Function to display popular quizzes
async function displayPopularQuizzes() {
    try {
        const response = await fetch('http://2.59.135.31:3000/api/quizzes/all');
        if (!response.ok) {
            throw new Error('Failed to fetch quizzes');
        }
        
        const quizSets = await response.json();
        
        // Sort quizzes by playCount in descending order
        const sortedQuizSets = quizSets.sort((a, b) => b.playCount - a.playCount);
        
        const popularQuizGrid = document.querySelector('.quiz-section:nth-of-type(3) .quiz-grid');
        
        // Clear existing content
        popularQuizGrid.innerHTML = `
            <button class="slide-btn prev-btn">&lt;</button>
            <div class="cards-container"></div>
            <button class="slide-btn next-btn">&gt;</button>
        `;

        const cardsContainer = popularQuizGrid.querySelector('.cards-container');
        
        // Create and append quiz cards
        sortedQuizSets.forEach(quizSet => {
            const quizCard = `
                <div class="quiz-card">
                    <div class="quiz-image"></div>
                    <div class="quiz-info">
                        <h4>${quizSet.title}</h4>
                        <div class="quiz-meta">
                            <span class="rating">${quizSet.playCount} plays</span>
                            <hr />
                            <span class="author">Creator: ${quizSet._id}</span>
                        </div>
                    </div>
                </div>
            `;
            cardsContainer.innerHTML += quizCard;
        });

        // Initialize carousel functionality
        let currentPage = 0;
        const cardsPerPage = 5;
        const totalPages = Math.ceil(sortedQuizSets.length / cardsPerPage);
        const cards = Array.from(cardsContainer.querySelectorAll('.quiz-card'));

        function updateCarousel() {
            cards.forEach((card, index) => {
                if (index >= currentPage * cardsPerPage && index < (currentPage + 1) * cardsPerPage) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        }

        // Add click handlers for buttons
        const prevBtn = popularQuizGrid.querySelector('.prev-btn');
        const nextBtn = popularQuizGrid.querySelector('.next-btn');

        prevBtn.addEventListener('click', () => {
            if (currentPage > 0) {
                currentPage--;
                updateCarousel();
            }
        });

        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages - 1) {
                currentPage++;
                updateCarousel();
            }
        });

        // Initial update
        updateCarousel();

    } catch (error) {
        console.error('Error fetching popular quizzes:', error);
    }
}

// Call both functions when the page loads
document.addEventListener('DOMContentLoaded', () => {
    displayQuizzes();
    displayPopularQuizzes();
});
