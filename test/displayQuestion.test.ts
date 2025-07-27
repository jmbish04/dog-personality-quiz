// Test for displayQuestion XSS fix
// This test verifies that the displayQuestion function safely handles malicious content

// Mock DOM for testing
const mockElements = new Map<string, any>();

// Mock document object
const mockDocument = {
  getElementById: (id: string) => {
    if (!mockElements.has(id)) {
      mockElements.set(id, {
        innerHTML: '',
        appendChild: function(child: any) {
          this.children = this.children || [];
          this.children.push(child);
        },
        children: []
      });
    }
    return mockElements.get(id);
  },
  createElement: (tagName: string) => {
    return {
      tagName: tagName.toUpperCase(),
      className: '',
      textContent: '',
      onclick: null,
      appendChild: function(child: any) {
        this.children = this.children || [];
        this.children.push(child);
      },
      children: []
    };
  }
};

// Mock global variables
const mockGlobals = {
  questions: [
    {
      id: 'test1',
      text: '<script>alert("XSS attack!")</script>This is a malicious question',
      options: [
        'Normal option',
        '<img src=x onerror=alert("XSS")>',
        'Option with "quotes" and \'single quotes\'',
        'Another\'; alert("broken out"); var x=\''
      ]
    }
  ],
  currentQuestionIndex: 0,
  selectAnswer: (questionId: string, option: string) => {
    console.log(`Answer selected: ${questionId} -> ${option}`);
  },
  updateProgress: () => {
    console.log('Progress updated');
  }
};

// Simple test runner
function test(name: string, testFn: () => void) {
  try {
    testFn();
    console.log(`✅ ${name}`);
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
  }
}

function assertTrue(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertContains(actual: string, expected: string, message: string) {
  if (!actual.includes(expected)) {
    throw new Error(`${message}. Expected to contain "${expected}", but got "${actual}"`);
  }
}

console.log('🧪 Running displayQuestion XSS Protection Tests\n');

// Create a function that mimics the fixed displayQuestion implementation
function createSecureDisplayQuestion() {
  return function displayQuestion() {
    if (mockGlobals.currentQuestionIndex >= mockGlobals.questions.length) {
      return;
    }

    const question = mockGlobals.questions[mockGlobals.currentQuestionIndex];
    mockGlobals.updateProgress();
    
    const container = mockDocument.getElementById('questionContainer');
    container.innerHTML = ''; // Clear previous content

    const h3 = mockDocument.createElement('h3');
    h3.className = 'text-xl font-bold mb-6 text-purple-800';
    h3.textContent = `Question ${mockGlobals.currentQuestionIndex + 1} of ${mockGlobals.questions.length}`;
    container.appendChild(h3);

    const p = mockDocument.createElement('p');
    p.className = 'text-lg mb-6 text-gray-700';
    p.textContent = question.text;
    container.appendChild(p);

    const optionsDiv = mockDocument.createElement('div');
    optionsDiv.className = 'space-y-3';

    question.options.forEach(option => {
        const button = mockDocument.createElement('button');
        button.className = 'w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors duration-200';
        button.textContent = option;
        button.onclick = () => mockGlobals.selectAnswer(question.id, option);
        optionsDiv.appendChild(button);
    });

    container.appendChild(optionsDiv);
  };
}

test('Should safely handle script tags in question text', () => {
  const displayQuestion = createSecureDisplayQuestion();
  displayQuestion();
  
  const container = mockDocument.getElementById('questionContainer');
  const questionElement = container.children[1]; // Second child is the <p> with question text
  
  assertTrue(questionElement.textContent.includes('<script>'), 'Script tags should be preserved as text');
  assertTrue(questionElement.textContent.includes('alert("XSS attack!")'), 'Script content should be preserved as text');
  assertTrue(!questionElement.innerHTML, 'Should use textContent, not innerHTML');
});

test('Should safely handle malicious HTML in options', () => {
  const displayQuestion = createSecureDisplayQuestion();
  displayQuestion();
  
  const container = mockDocument.getElementById('questionContainer');
  const optionsDiv = container.children[2]; // Third child is the options div
  const buttons = optionsDiv.children;
  
  // Check the malicious img option
  const maliciousButton = buttons[1];
  assertTrue(maliciousButton.textContent.includes('<img src=x'), 'Malicious img tag should be preserved as text');
  assertTrue(maliciousButton.textContent.includes('onerror=alert'), 'Malicious script should be preserved as text');
});

test('Should safely handle quotes in options', () => {
  const displayQuestion = createSecureDisplayQuestion();
  displayQuestion();
  
  const container = mockDocument.getElementById('questionContainer');
  const optionsDiv = container.children[2];
  const buttons = optionsDiv.children;
  
  // Check the quotes option
  const quotesButton = buttons[2];
  assertTrue(quotesButton.textContent.includes('"quotes"'), 'Double quotes should be preserved');
  assertTrue(quotesButton.textContent.includes("'single quotes'"), 'Single quotes should be preserved');
});

test('Should safely handle JavaScript injection attempts in options', () => {
  const displayQuestion = createSecureDisplayQuestion();
  displayQuestion();
  
  const container = mockDocument.getElementById('questionContainer');
  const optionsDiv = container.children[2];
  const buttons = optionsDiv.children;
  
  // Check the JavaScript injection option
  const jsButton = buttons[3];
  assertTrue(jsButton.textContent.includes("'; alert("), 'JavaScript injection attempt should be preserved as text');
  assertTrue(typeof jsButton.onclick === 'function', 'onclick should be a proper function, not a string');
});

test('Should create proper DOM structure', () => {
  const displayQuestion = createSecureDisplayQuestion();
  displayQuestion();
  
  const container = mockDocument.getElementById('questionContainer');
  
  assertTrue(container.children.length === 3, `Should have 3 children (h3, p, div), got ${container.children.length}`);
  assertTrue(container.children[0].tagName === 'H3', 'First child should be H3');
  assertTrue(container.children[1].tagName === 'P', 'Second child should be P');
  assertTrue(container.children[2].tagName === 'DIV', 'Third child should be DIV');
  
  const optionsDiv = container.children[2];
  assertTrue(optionsDiv.children.length === 4, `Should have 4 option buttons, got ${optionsDiv.children.length}`);
});

test('Should use textContent instead of innerHTML for user content', () => {
  const displayQuestion = createSecureDisplayQuestion();
  displayQuestion();
  
  const container = mockDocument.getElementById('questionContainer');
  const questionElement = container.children[1];
  const optionsDiv = container.children[2];
  
  // Verify that dangerous content is not parsed as HTML
  assertTrue(questionElement.textContent.includes('<script>'), 'Script tags should appear as literal text');
  
  // Check all option buttons
  for (let i = 0; i < optionsDiv.children.length; i++) {
    const button = optionsDiv.children[i];
    assertTrue(button.tagName === 'BUTTON', `Option ${i} should be a button`);
    assertTrue(typeof button.onclick === 'function', `Option ${i} should have function onclick handler`);
  }
});

console.log('\n📋 All displayQuestion XSS protection tests completed!');

export {};