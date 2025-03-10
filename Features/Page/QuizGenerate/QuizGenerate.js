document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generateBtn');
    const playNowBtn = document.getElementById('playNowBtn'); // New Play Now button
    const topicInput = document.getElementById('topic');
    const numQuestionsInput = document.getElementById('numQuestions');
    const languageSelect = document.getElementById('language');
    const container = document.querySelector('.container');
    
    generateBtn.addEventListener('click', async (e) => {
        e.preventDefault(); // Prevent default form submission

        // Get user input values
        const quizData = {
            topic: topicInput.value.trim(),
            numberOfQuestions: parseInt(numQuestionsInput.value),
            language: languageSelect.value === 'english' ? 'en' : 
                      languageSelect.value === 'vietnamese' ? 'vi' : 
                      languageSelect.value === 'chinese' ? 'zh' : 
                      languageSelect.value === 'japanese' ? 'ja' : 'en'
        };

        // Input validation
        if (!quizData.topic) {
            alert('Please enter a quiz topic');
            return;
        }

        if (quizData.numberOfQuestions < 1 || quizData.numberOfQuestions > 20) {
            alert('Number of questions must be between 1 and 20');
            return;
        }
        
        // Show loading state
        container.classList.add('loading');
        document.querySelector('.loading-text').textContent = "AI is generating your quiz... 🚀";

        try {
            // Make API call to generate the quiz
            const response = await fetch('http://2.59.135.31:3000/api/quizzes/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(quizData)
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();

            if (!result.quizSet || !result.quizSet.id) {
                throw new Error('Unexpected API response format');
            }

            // Remove loading state and show completion state
            container.classList.remove('loading');
            container.classList.add('completed');

            // Store the generated quiz ID
            localStorage.setItem('generatedQuizId', result.quizSet.id);

            // Show and enable Play Now button
            playNowBtn.style.display = 'block';
            playNowBtn.onclick = () => {
                window.location.href = `Features/Page/AwnserPage/AwnserPage.html?id=${result.quizSet.id}`;
            };
        } catch (error) {
            console.error('Error generating quiz:', error);
            alert('Failed to generate quiz. Please try again.');
            container.classList.remove('loading');
        }
    });

    // Number input validation
    numQuestionsInput.addEventListener('input', () => {
        const value = parseInt(numQuestionsInput.value);
        if (value < 1) numQuestionsInput.value = 1;
        if (value > 20) numQuestionsInput.value = 20;
    });
});