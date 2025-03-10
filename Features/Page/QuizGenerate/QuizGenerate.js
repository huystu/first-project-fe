document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generateBtn');
    const topicInput = document.getElementById('topic');
    const numQuestionsInput = document.getElementById('numQuestions');
    const container = document.querySelector('.container');
    const languageSelect = document.getElementById('language');

    generateBtn.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent form submission

        // Get form values
        const quizData = {
            topic: topicInput.value.trim(),
            numQuestions: parseInt(numQuestionsInput.value),
            language: languageSelect.value
        };

        // Validate input
        if (!quizData.topic) {
            alert('Please enter a quiz topic');
            return;
        }

        if (quizData.numQuestions < 5 || quizData.numQuestions > 20) {
            alert('Number of questions must be between 5 and 20');
            return;
        }
        
        // First, remove any existing states
        container.classList.remove('completed');
        
        // Show loading state
        container.classList.add('loading');

        // Simulate loading time (replace this with your actual quiz generation logic)
        setTimeout(() => {
            // Remove loading state
            container.classList.remove('loading');
            
            // Show completion state
            container.classList.add('completed');
            
            console.log('Quiz generated:', quizData); // For debugging
        }, 2000);
    });

    // Add input validation
    numQuestionsInput.addEventListener('input', () => {
        const value = parseInt(numQuestionsInput.value);
        if (value < 1) numQuestionsInput.value = 1;
        if (value > 20) numQuestionsInput.value = 20;
    });
}); 