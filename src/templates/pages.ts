export function getHomePage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🐶 Dog Personality Quiz</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    animation: {
                        'bounce-slow': 'bounce 2s infinite',
                        'pulse-slow': 'pulse 3s infinite',
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-gradient-to-br from-blue-100 to-purple-100 min-h-screen">
    <div class="container mx-auto px-4 py-8">
        <header class="text-center mb-12">
            <h1 class="text-6xl font-bold text-purple-800 mb-4 animate-bounce-slow">
                🐶 Dog Personality Quiz
            </h1>
            <p class="text-xl text-gray-700 max-w-2xl mx-auto">
                Discover your dog's unique personality with AI-powered insights, 
                personalized trait analysis, and beautiful custom images!
            </p>
        </header>

        <div class="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
            <h2 class="text-2xl font-bold text-center mb-6 text-purple-800">
                Start Your Dog's Journey
            </h2>
            
            <form id="startForm" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        🐕 Dog's Name *
                    </label>
                    <input type="text" id="dogName" required
                           class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                           placeholder="Enter your dog's name">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        🎯 Breed (optional)
                    </label>
                    <input type="text" id="breed"
                           class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                           placeholder="e.g., Golden Retriever, Mixed">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        🎂 Age (optional)
                    </label>
                    <select id="age" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                        <option value="">Select age</option>
                        <option value="puppy">Puppy (0-1 year)</option>
                        <option value="young">Young (1-3 years)</option>
                        <option value="adult">Adult (3-7 years)</option>
                        <option value="senior">Senior (7+ years)</option>
                    </select>
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        ⚥ Gender (optional)
                    </label>
                    <select id="gender" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                    </select>
                </div>

                <button type="submit" 
                        class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 transform hover:scale-105">
                    🚀 Start Quiz
                </button>
            </form>
        </div>

        <div class="mt-12 text-center text-gray-600">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div class="bg-white rounded-lg p-6 shadow-lg">
                    <div class="text-3xl mb-3">🧠</div>
                    <h3 class="font-bold text-purple-800 mb-2">AI-Powered Analysis</h3>
                    <p class="text-sm">Advanced AI analyzes your answers to create a detailed personality profile</p>
                </div>
                <div class="bg-white rounded-lg p-6 shadow-lg">
                    <div class="text-3xl mb-3">🎨</div>
                    <h3 class="font-bold text-purple-800 mb-2">Custom Images</h3>
                    <p class="text-sm">Beautiful AI-generated images for each personality trait</p>
                </div>
                <div class="bg-white rounded-lg p-6 shadow-lg">
                    <div class="text-3xl mb-3">📱</div>
                    <h3 class="font-bold text-purple-800 mb-2">Shareable Results</h3>
                    <p class="text-sm">Share your dog's personality with friends and family</p>
                </div>
            </div>
        </div>
    </div>

    <script>
        document.getElementById('startForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = {
                dog_name: document.getElementById('dogName').value,
                breed: document.getElementById('breed').value,
                age: document.getElementById('age').value,
                gender: document.getElementById('gender').value
            };

            try {
                const response = await fetch('/api/quiz/start', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (result.success) {
                    window.location.href = '/quiz/' + result.session_id;
                } else {
                    alert('Error: ' + result.error);
                }
            } catch (error) {
                alert('Error starting quiz: ' + error.message);
            }
        });
    </script>
</body>
</html>`;
}

export function getQuizPage(slug: string, session: any): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quiz - ${session.dog_name} | Dog Personality Quiz</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-br from-blue-100 to-purple-100 min-h-screen">
    <div class="container mx-auto px-4 py-8">
        <header class="text-center mb-8">
            <h1 class="text-4xl font-bold text-purple-800 mb-2">
                🐶 ${session.dog_name}'s Personality Quiz
            </h1>
            <div class="bg-white rounded-full px-6 py-2 inline-block shadow-lg">
                <span id="progress" class="text-purple-600 font-semibold">Loading...</span>
            </div>
        </header>

        <div id="photoUpload" class="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 mb-8" style="display: ${session.photo_url ? 'none' : 'block'}">
            <h2 class="text-xl font-bold text-center mb-4 text-purple-800">
                📸 Upload ${session.dog_name}'s Photo (Optional)
            </h2>
            <p class="text-gray-600 text-center mb-6">
                Add a photo to create personalized AI images for each trait!
            </p>
            
            <form id="photoForm" class="text-center">
                <input type="file" id="photoInput" accept="image/*" class="mb-4">
                <div class="space-x-4">
                    <button type="submit" class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg">
                        Upload Photo
                    </button>
                    <button type="button" onclick="skipPhoto()" class="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg">
                        Skip
                    </button>
                </div>
            </form>
        </div>

        <div id="quizContainer" class="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8" style="display: none">
            <div id="questionContainer">
                <!-- Questions will be loaded here -->
            </div>
        </div>

        <div id="loadingContainer" class="text-center" style="display: none">
            <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p class="text-purple-600 font-semibold">Generating your results...</p>
        </div>
    </div>

    <script>
        let questions = [];
        let currentQuestionIndex = 0;
        let answers = {};

        async function loadQuestions() {
            try {
                const response = await fetch('/api/quiz/${slug}/questions');
                const result = await response.json();
                
                if (result.success) {
                    questions = result.questions;
                    if (questions.length > 0) {
                        showQuiz();
                        displayQuestion();
                    }
                }
            } catch (error) {
                console.error('Error loading questions:', error);
            }
        }

        function showQuiz() {
            document.getElementById('quizContainer').style.display = 'block';
            updateProgress();
        }

        function displayQuestion() {
            if (currentQuestionIndex >= questions.length) {
                finishQuiz();
                return;
            }

            const question = questions[currentQuestionIndex];
            updateProgress();
            
            document.getElementById('questionContainer').innerHTML = \`
                <h3 class="text-xl font-bold mb-6 text-purple-800">
                    Question \${currentQuestionIndex + 1} of \${questions.length}
                </h3>
                <p class="text-lg mb-6 text-gray-700">\${question.text}</p>
                <div class="space-y-3">
                    \${question.options.map((option, index) => \`
                        <button onclick="selectAnswer('\${question.id}', '\${option}')" 
                                class="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors duration-200">
                            \${option}
                        </button>
                    \`).join('')}
                </div>
            \`;
        }

        async function selectAnswer(questionId, selectedOption) {
            answers[questionId] = selectedOption;
            
            try {
                await fetch('/api/quiz/${slug}/answer', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        question_id: questionId,
                        selected_option: selectedOption
                    })
                });
            } catch (error) {
                console.error('Error saving answer:', error);
            }

            currentQuestionIndex++;
            displayQuestion();
        }

        async function finishQuiz() {
            document.getElementById('quizContainer').style.display = 'none';
            document.getElementById('loadingContainer').style.display = 'block';
            
            try {
                const response = await fetch('/api/results/${slug}/generate', {
                    method: 'POST'
                });
                
                const result = await response.json();
                
                if (result.success) {
                    window.location.href = '/results/${slug}';
                } else {
                    alert('Error generating results: ' + result.error);
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }

        function updateProgress() {
            const total = questions.length || 1;
            const completed = currentQuestionIndex;
            const percentage = Math.round((completed / total) * 100);
            document.getElementById('progress').textContent = \`\${completed}/\${total} questions (\${percentage}%)\`;
        }

        // Photo upload
        document.getElementById('photoForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const fileInput = document.getElementById('photoInput');
            const file = fileInput.files[0];
            
            if (!file) {
                alert('Please select a photo first');
                return;
            }

            const formData = new FormData();
            formData.append('photo', file);

            try {
                const response = await fetch('/api/quiz/${slug}/photo', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();
                
                if (result.success) {
                    document.getElementById('photoUpload').style.display = 'none';
                    loadQuestions();
                } else {
                    alert('Error uploading photo: ' + result.error);
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        });

        function skipPhoto() {
            document.getElementById('photoUpload').style.display = 'none';
            loadQuestions();
        }

        // Initialize
        if ('${session.photo_url}') {
            loadQuestions();
        }
    </script>
</body>
</html>`;
}

export function getResultsPage(slug: string, sessionData: any): string {
  const scores = JSON.parse(sessionData.scores || '{}');
  const generatedImages = JSON.parse(sessionData.generated_images || '{}');
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${sessionData.title} | Dog Personality Quiz</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <meta property="og:title" content="${sessionData.title}">
    <meta property="og:description" content="Check out ${sessionData.dog_name}'s personality quiz results!">
    <meta property="og:type" content="website">
</head>
<body class="bg-gradient-to-br from-blue-100 to-purple-100 min-h-screen">
    <div class="container mx-auto px-4 py-8">
        <header class="text-center mb-12">
            <h1 class="text-5xl font-bold text-purple-800 mb-4">
                ${sessionData.title}
            </h1>
            <p class="text-xl text-gray-700 mb-6">
                ${sessionData.summary}
            </p>
            
            <div class="flex justify-center space-x-4">
                <button onclick="shareResults()" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold">
                    📱 Share Results
                </button>
                <button onclick="startNewQuiz()" class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold">
                    🐶 New Quiz
                </button>
            </div>
        </header>

        <div class="max-w-4xl mx-auto space-y-8">
            ${Object.entries(scores).map(([trait, data]: [string, any]) => `
                <div class="bg-white rounded-2xl shadow-xl p-8">
                    <div class="text-center mb-6">
                        <h2 class="text-3xl font-bold text-purple-800 mb-2">
                            ${data.emoji} ${trait.toUpperCase()} - ${data.label}
                        </h2>
                        <p class="text-lg text-gray-700 mb-4">${data.description}</p>
                        <div class="w-full bg-gray-200 rounded-full h-4 mb-4">
                            <div class="bg-gradient-to-r from-purple-500 to-pink-500 h-4 rounded-full" 
                                 style="width: ${data.score}%"></div>
                        </div>
                        <span class="text-2xl font-bold text-purple-600">${data.score}/100</span>
                    </div>
                    
                    ${generatedImages[trait] ? `
                        <div class="text-center mb-6">
                            <div class="relative inline-block">
                                <img src="/images/${generatedImages[trait]}" 
                                     alt="${trait} image for ${sessionData.dog_name}"
                                     class="w-64 h-64 object-cover rounded-full shadow-lg">
                                <div class="absolute -top-2 -right-2">
                                    <span class="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                                        ${data.label}
                                    </span>
                                </div>
                            </div>
                            <div class="mt-4 space-x-4">
                                <button onclick="regenerateImage('${trait}')" 
                                        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                                    🎨 New Image
                                </button>
                                <button onclick="shareImage('${trait}')" 
                                        class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
                                    📱 Share Image
                                </button>
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="text-center">
                        <button onclick="askAboutTrait('${trait}')" 
                                class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg">
                            💬 Ask about ${trait}
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>

        <!-- Chat Modal -->
        <div id="chatModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50">
            <div class="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
                <h3 class="text-xl font-bold mb-4 text-purple-800">Chat about ${sessionData.dog_name}</h3>
                <div id="chatMessages" class="mb-4 max-h-64 overflow-y-auto"></div>
                <div class="flex space-x-2">
                    <input type="text" id="chatInput" placeholder="Ask about your dog's personality..." 
                           class="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500">
                    <button onclick="sendChatMessage()" class="bg-purple-600 text-white px-4 py-2 rounded-lg">
                        Send
                    </button>
                </div>
                <button onclick="closeChatModal()" class="mt-4 w-full bg-gray-400 text-white py-2 rounded-lg">
                    Close
                </button>
            </div>
        </div>
    </div>

    <script>
        function shareResults() {
            if (navigator.share) {
                navigator.share({
                    title: '${sessionData.title}',
                    text: 'Check out ${sessionData.dog_name}\\'s personality quiz results!',
                    url: window.location.href
                });
            } else {
                // Fallback for browsers that don't support Web Share API
                navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
            }
        }

        function shareImage(trait) {
            const generatedImages = ${JSON.stringify(generatedImages)};
            const imageUrl = window.location.origin + '/images/' + (generatedImages[trait] || 'placeholder.png');
            if (navigator.share) {
                navigator.share({
                    title: '${sessionData.dog_name}\\'s ' + trait + ' personality',
                    url: imageUrl
                });
            } else {
                navigator.clipboard.writeText(imageUrl);
                alert('Image link copied to clipboard!');
            }
        }

        async function regenerateImage(trait) {
            try {
                const response = await fetch('/api/results/${slug}/regenerate-image/' + trait, {
                    method: 'POST'
                });
                
                const result = await response.json();
                
                if (result.success) {
                    const img = document.querySelector(\`img[alt^="\${trait} image"]\`);
                    if (img) {
                        img.src = \`/images/\${result.new_image}?t=\${new Date().getTime()}\`;
                    } else {
                        location.reload(); // Fallback if image not found
                    }
                } else {
                    alert('Error regenerating image: ' + result.error);
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }

        function askAboutTrait(trait) {
            document.getElementById('chatInput').value = 'Tell me more about ' + trait;
            document.getElementById('chatModal').classList.remove('hidden');
            document.getElementById('chatModal').classList.add('flex');
        }

        async function sendChatMessage() {
            const input = document.getElementById('chatInput');
            const message = input.value.trim();
            
            if (!message) return;
            
            // Add user message to chat
            addChatMessage('You: ' + message, 'user');
            input.value = '';
            
            try {
                const response = await fetch('/api/results/${slug}/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    addChatMessage('Expert: ' + result.response, 'bot');
                } else {
                    addChatMessage('Error: ' + result.error, 'error');
                }
            } catch (error) {
                addChatMessage('Error: ' + error.message, 'error');
            }
        }

        function addChatMessage(message, type) {
            const messagesDiv = document.getElementById('chatMessages');
            const messageDiv = document.createElement('div');
            messageDiv.className = 'mb-2 p-2 rounded-lg ' + 
                (type === 'user' ? 'bg-purple-100 text-purple-800' : 
                 type === 'bot' ? 'bg-gray-100 text-gray-800' : 'bg-red-100 text-red-800');
            messageDiv.textContent = message;
            messagesDiv.appendChild(messageDiv);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        function closeChatModal() {
            document.getElementById('chatModal').classList.add('hidden');
            document.getElementById('chatModal').classList.remove('flex');
            document.getElementById('chatMessages').innerHTML = '';
        }

        function startNewQuiz() {
            window.location.href = '/';
        }

        // Enter key support for chat
        document.getElementById('chatInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    </script>
</body>
</html>`;
}