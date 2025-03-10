document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generateBtn');
    const topicInput = document.getElementById('topic');
    const numQuestionsInput = document.getElementById('numQuestions');
    const container = document.querySelector('.container');
    const languageSelect = document.getElementById('language');

    generateBtn.addEventListener('click', async (e) => {
        e.preventDefault(); // Prevent form submission

        // Get form values
        const quizData = {
            topic: topicInput.value.trim(),
            numberOfQuestions: parseInt(numQuestionsInput.value),
            language: languageSelect.value === 'english' ? 'en' : 
                      languageSelect.value === 'vietnamese' ? 'vi' : 
                      languageSelect.value === 'chinese' ? 'zh' : 
                      languageSelect.value === 'japanese' ? 'ja' : 'en'
        };

        // Validate input
        if (!quizData.topic) {
            alert('Please enter a quiz topic');
            return;
        }

        if (quizData.numberOfQuestions < 1 || quizData.numberOfQuestions > 20) {
            alert('Number of questions must be between 1 and 20');
            return;
        }
        
        // Remove any existing states
        container.classList.remove('completed');
        
        // Show loading state
        container.classList.add('loading');

        try {
            console.log(quizData);
            // Make API call to generate quiz
            const response = await fetch('http://2.59.135.31:3000/api/quizzes/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(quizData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            // Check if the response matches the expected format
            if (!result.message || !result.quizSet || !result.quizSet.id || !result.quizSet.questions) {
                throw new Error('Unexpected API response format');
            }

            // Remove loading state
            container.classList.remove('loading');
            
            // Show completion state
            container.classList.add('completed');
            
            console.log('Quiz generated successfully:', result);
            console.log('Quiz Title:', result.quizSet.title);
            console.log('Quiz Description:', result.quizSet.description);
            console.log('Question IDs:', result.quizSet.questions);
            
            // Store the quiz data in localStorage (optional, can be removed if not needed)
            localStorage.setItem('generatedQuiz', JSON.stringify(result.quizSet));

        } catch (error) {
            console.error('Error generating quiz:', error);
            alert('Failed to generate quiz. Please try again.');
            container.classList.remove('loading');
        }
    });

    // Add input validation
    numQuestionsInput.addEventListener('input', () => {
        const value = parseInt(numQuestionsInput.value);
        if (value < 1) numQuestionsInput.value = 1;
        if (value > 20) numQuestionsInput.value = 20;
    });
});