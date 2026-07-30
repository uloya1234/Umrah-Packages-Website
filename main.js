// main.js

/**
 * Helper function to parse basic Markdown (Gemini response) into clean HTML
 */
function parseMarkdownToHTML(markdown) {
  if (!markdown) return '';
  return markdown
    // Convert headers (e.g. ## Title -> <h3>Title</h3>)
    .replace(/^### (.*$)/gim, '<h4>$1</h4>')
    .replace(/^## (.*$)/gim, '<h3>$1</h3>')
    .replace(/^# (.*$)/gim, '<h2>$1</h2>')
    // Convert bold text (e.g. **bold** -> <strong>bold</strong>)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Convert italic text (e.g. *italic* -> <em>italic</em>)
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Convert line breaks to paragraphs/breaks
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

/**
 * Fetch an AI Practice Quiz from your Flask backend
 */
async function fetchAIPracticeQuiz(e) {
  if (e) e.preventDefault(); // Prevent form reload if triggered by submit event

  const quizContainer = document.querySelector('#quiz-container');
  const subjectInput = document.querySelector('#quiz-subject');
  const topicInput = document.querySelector('#quiz-topic');

  // Grab user input values or fallback to defaults
  const subject = subjectInput ? subjectInput.value.trim() : 'Algebra II';
  const topic = topicInput ? topicInput.value.trim() : 'Factoring Polynomials';

  if (quizContainer) {
    quizContainer.innerHTML = '<p class="loading">Generating quiz... (Render may take ~50s on cold start)</p>';
  }

  try {
    const response = await fetch('/api/generate-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        subject: subject || 'Algebra II', 
        topic: topic || 'Factoring Polynomials' 
      })
    });

    const data = await response.json();

    if (data.success && quizContainer) {
      // Parse raw Gemini markdown into formatted HTML
      quizContainer.innerHTML = parseMarkdownToHTML(data.quiz);
    } else if (quizContainer) {
      quizContainer.innerText = `Error: ${data.error || 'Failed to load quiz. Please try again.'}`;
    }
  } catch (error) {
    console.error('Error fetching quiz:', error);
    if (quizContainer) {
      quizContainer.innerText = 'Error connecting to server. Please check your network connection.';
    }
  }
}

/**
 * Submit Booking Request to Flask backend
 */
async function handleBookingSubmit(e) {
  e.preventDefault();

  const nameInput = document.querySelector('#student-name');
  const tutorInput = document.querySelector('#tutor-select');
  const timeInput = document.querySelector('#session-time');
  const statusContainer = document.querySelector('#booking-status');

  const payload = {
    name: nameInput ? nameInput.value : '',
    tutor: tutorInput ? tutorInput.value : '',
    time: timeInput ? timeInput.value : ''
  };

  if (statusContainer) {
    statusContainer.innerText = 'Submitting booking...';
  }

  const data = await sendDataToBackend('/api/book-session', payload);

  if (statusContainer) {
    if (data.success) {
      statusContainer.innerText = data.message || 'Booking successful!';
      e.target.reset(); // Clear the form
    } else {
      statusContainer.innerText = `Booking failed: ${data.error || 'Unknown error'}`;
    }
  }
}

/**
 * Generic API POST helper function
 */
async function sendDataToBackend(endpoint, payload) {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    return await response.json();
  } catch (error) {
    console.error(`API Request failed for ${endpoint}:`, error);
    return { success: false, error: 'Network error connecting to backend.' };
  }
}

// Bind DOM event listeners on load
document.addEventListener('DOMContentLoaded', () => {
  console.log('JavaScript initialized successfully!');

  // Bind Quiz Form if present
  const quizForm = document.querySelector('#quiz-form');
  if (quizForm) {
    quizForm.addEventListener('submit', fetchAIPracticeQuiz);
  }

  // Bind Booking Form if present
  const bookingForm = document.querySelector('#booking-form');
  if (bookingForm) {
    bookingForm.addEventListener('submit', handleBookingSubmit);
  }
});
