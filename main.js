const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx97zhrNR76hdMWnwAyXm4rU8Vo0_p8K0c4z20ZxZYoYQ62okarnFl_FY3KPZKYpgRiUQ/exec';

function logEvent(logObject) {
    fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(logObject)
    }).catch(err => console.error('Error sending log to Google Sheet:', err));
}

function createLogEntry(event, eventText, descriptionText = "") {
    // Generate a reliable IST timestamp directly in the browser.
    const now = new Date();
    const timestamp = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)).toISOString().replace('Z', '+05:30');

    const studentId = document.getElementById('student-id').value.trim().toUpperCase() || 'GUEST';

    let description;
    if (descriptionText) {
        description = descriptionText;
    } else if (event) {
        description = JSON.stringify({
            type: 'click',
            target_id: event.target.id,
            target_tagName: event.target.tagName,
            target_className: event.target.className,
            x: event.clientX,
            y: event.clientY
        });
    } else {
        description = "";
    }

    const logObject = {
        timestamp: timestamp, // Send the timestamp from the client
        user: studentId,
        event: eventText,
        description: description,
    };

    logEvent(logObject);
}


// Categorize questions by count for section navigation and topic assignment
function categorizeQuestionsByCount(questions) {
    if (questions.length === 175) {
        let start = 0;
        const sections = [
            { topic: 'Traffic', count: 85 },
            { topic: 'GK/Rajabhasha', count: 55 },
            { topic: 'Est/Fin/Acc', count: 35 }
        ];
        return sections.flatMap(section => {
            const sectionQuestions = questions.slice(start, start + section.count)
                .map(q => ({ ...q, topic: section.topic }));
            start += section.count;
            return sectionQuestions;
        });
    } else if (questions.length === 110) {
        let start = 0;
        const sections = [
            { topic: 'Traffic', count: 70 },
            { topic: 'Rajabhasha', count: 10 },
            { topic: 'Est/Fin/Acc', count: 30 }
        ];
        return sections.flatMap(section => {
            const sectionQuestions = questions.slice(start, start + section.count)
                .map(q => ({ ...q, topic: section.topic }));
            start += section.count;
            return sectionQuestions;
        });
    } else {
        // No section breakdown for other counts
        return questions.map(q => ({ ...q, topic: 'General' }));
    }
}
// Section navigation button labels for 175 and 110 question exams
const sectionLabels_30 = [
    { label: 'Technical', key: 'Traffic' },
    { label: 'GK & Rajbhasha', key: 'GK/Rajabhasha' },
    { label: 'Est & Finance', key: 'Est/Fin/Acc' }
];
const sectionLabels_70 = [
    { label: 'Traffic', key: 'Traffic' },
    { label: 'Rajabhasha', key: 'Rajabhasha' },
    { label: 'Est/Fin/Acc', key: 'Est/Fin/Acc' }
];

// Render section navigation buttons based on question count
function renderSectionNav() {
    const nav = document.getElementById('section-nav');
    nav.innerHTML = '';
    let labels = [];
    let sectionRanges = [];
    if (questions.length === 175) {
        labels = sectionLabels_30;
        sectionRanges = [0, 85, 140, 175];
    } else if (questions.length === 110) {
        labels = sectionLabels_70;
        sectionRanges = [0, 70, 80, 110];
    } else {
        return;
    }
    for (let i = 0; i < labels.length; i++) {
        const btn = document.createElement('button');
        btn.className = 'btn btn-outline-primary btn-sm section-nav-btn';
        btn.textContent = labels[i].label;
        btn.onclick = () => jumpToSection(labels[i].key);
        btn.dataset.sectionIndex = i;
        nav.appendChild(btn);
    }
    // Highlight the correct tab based on currentQuestion
    highlightSectionTab(sectionRanges);
}

function highlightSectionTab(sectionRanges) {
    const nav = document.getElementById('section-nav');
    const btns = nav.querySelectorAll('.section-nav-btn');
    let activeIdx = 0;
    for (let i = 0; i < sectionRanges.length - 1; i++) {
        if (currentQuestion >= sectionRanges[i] && currentQuestion < sectionRanges[i + 1]) {
            activeIdx = i;
            break;
        }
    }
    // Remove 'active' from all tabs first
    btns.forEach(btn => btn.classList.remove('active'));
    // Add 'active' only to the current tab
    if (btns[activeIdx]) btns[activeIdx].classList.add('active');
}

// Jump to the first question of a section by key
function jumpToSection(sectionKey) {
    let idx = 0;
    if (questions.length === 175) {
        if (sectionKey === 'Traffic') idx = 0;
        else if (sectionKey === 'GK/Rajabhasha') idx = 85;
        else if (sectionKey === 'Est/Fin/Acc') idx = 140;
    } else if (questions.length === 110) {
        if (sectionKey === 'Traffic') idx = 0;
        else if (sectionKey === 'Rajabhasha') idx = 70;
        else if (sectionKey === 'Est/Fin/Acc') idx = 80;
    } else {
        idx = questions.findIndex(q => (q.topic || q.section) === sectionKey);
    }
    if (idx !== -1 && questions[idx]) {
        currentQuestion = idx;
        loadQuestion(currentQuestion);
        let labels = sectionLabels_30;
        if (questions.length === 110) labels = sectionLabels_70;
        document.querySelectorAll('.section-nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent.trim() === labels.find(l => l.key === sectionKey).label) {
                btn.classList.add('active');
            }
        });
        setTimeout(() => {
            const qCont = document.getElementById('questions-container');
            if (qCont) qCont.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}
// --- Global State and DOM Elements ---
let questions = []; // Holds current exam questions
let currentQuestion = 0; // Current question index
let isFreeUser = document.getElementById('free_user').checked;
let EXAM_QUESTION_COUNT; // Total number of questions for the exam
let EXAM_TIME_LIMIT_MINUTES; // Exam duration in minutes
let TOTAL_QUESTIONS; // For progress display
let userAnswers = []; // User's selected answers
let timeLeft; // Time left in seconds

// ***** NEW: Section attempt limits state *****
let sectionAttemptLimits = {}; // { 'Traffic': 80, 'GK/Rajabhasha': 30, 'Est/Fin/Acc': 30 } etc.
let sectionAttempts = {};      // Running counts per (combined) section

// DOM element references
const loginPage = document.getElementById('login-page');
const examSelectionPage = document.getElementById('exam-selection-page');
const examPage = document.getElementById('exam-page');
const resultPage = document.getElementById('result-page');
const questionsContainer = document.getElementById('questions-container');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const submitBtn = document.getElementById('submit-btn');
const timerElement = document.getElementById('timer');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');
const scoreElement = document.getElementById('score');
const feedbackElement = document.getElementById('feedback');
const sectionScoreElement = document.getElementById('sectionScore');
const viewAnswersBtn = document.getElementById('view-answers-btn');
const answersContainer = document.getElementById('answers-container');
const correctAnswersContainer = document.getElementById('correct-answers');
const retakeBtn = document.getElementById('retake-btn');
const excelUpload = document.getElementById('excel-upload');
const loginBtn = document.getElementById('login-btn');
const selectExamBtn = document.getElementById('select-exam-btn');
const studentIdInput = document.getElementById('student-id');
const passwordInput = document.getElementById('password-input');
const toast = document.getElementById('toast');
const toastTitle = document.getElementById('toast-title');
const toastMessage = document.getElementById('toast-message');
const bsToast = new bootstrap.Toast(toast);
submitBtn.type = 'button';
const togglePassword = document.getElementById('show-password');
togglePassword.addEventListener('change', function () {
    passwordInput.type = this.checked ? 'text' : 'password';
});

// --- Start of new code to add ---

// Define which exams each user can access


// Render the exam selection radio buttons for allowed exams
function renderExamSelection(allowedExams) {
    const examSelectionContainer = document.getElementById('exam-selection-options');
    examSelectionContainer.innerHTML = '';
    if (allowedExams && allowedExams.length > 0) {
        const examLabels = {
            'auto': 'Automatic Block System (AUTO) Exam',
            'AOM23JUNE': 'AOM - JUNE 2023',
            'generalSafetyRules': 'MDTC GENERAL SAFETY RULES',
            'AOM20112022_30': 'AOM 30% LDCE - 20th NOV 2022',
            'AOM19022023_70': 'AOM 70% LDCE - 19th FEB 2023',
            'AOM05032023_70': 'AOM 70% LDCE - 05th MAR 2023',
            'AOM25062023_30': 'AOM 30% LDCE - 25th JUNE 2023'
        };
        allowedExams.forEach((exam, idx) => {
            const labelText = examLabels[exam] || exam;
            const isChecked = (allowedExams.length === 1 || idx === 0) ? 'checked' : '';
            const optionHtml = `
                <div class="form-check text-start">
                    <input class="form-check-input option-input" type="radio" name="exam_type" id="${exam}_exam" value="${exam}" ${isChecked}>
                    <label class="form-check-label option-label" for="${exam}_exam">${labelText}</label>
                </div>
            `;
            examSelectionContainer.innerHTML += optionHtml;
        });
        // Remove instructions loading from here; will be loaded after exam selection
    } else {
        examSelectionContainer.innerHTML = `<p>No exams available for this user. Contact KOMMARA SURESH</p>`;
        document.getElementById('select-exam-btn').disabled = true;
    }
}

// --- End of new code to add ---

function showToast(title, message, type = 'primary') {
    toastTitle.textContent = title;
    toastMessage.textContent = message;
    toast.className = `toast border-${type}`;
    bsToast.show();

    document.getElementById("e-id").innerHTML = "Crew ID: " + studentIdInput.value.toLocaleUpperCase();
}

// ***** NEW: Section limits helpers *****
function initSectionLimits(totalQuestions) {
    // Set caps as per your requirement
    if (totalQuestions === 175) {
        sectionAttemptLimits = {
            'Traffic': 80,
            'GK/Rajabhasha': 40,
            'Est/Fin/Acc': 30
        };
    } else if (totalQuestions === 110) {
        // Combined cap for Traffic + Rajabhasha = 70
        sectionAttemptLimits = {
            'Traffic+Rajabhasha': 70,
            // Est/Fin/Acc has no special cap (all 30 can be answered)
        };
    } else {
        sectionAttemptLimits = {};
    }
    recomputeSectionAttempts(); // start fresh from current userAnswers
}

function getSectionKey(question) {
    if (questions.length === 175) {
        return question.topic; // 'Traffic' | 'GK/Rajabhasha' | 'Est/Fin/Acc'
    } else if (questions.length === 110) {
        if (question.topic === 'Traffic' || question.topic === 'Rajabhasha') {
            return 'Traffic+Rajabhasha';
        }
        return question.topic; // 'Est/Fin/Acc'
    }
    return 'General';
}

function recomputeSectionAttempts() {
    sectionAttempts = {};
    if (!Array.isArray(userAnswers)) return;
    for (let i = 0; i < userAnswers.length; i++) {
        if (userAnswers[i] !== null) {
            const key = getSectionKey(questions[i]);
            sectionAttempts[key] = (sectionAttempts[key] || 0) + 1;
        }
    }
}

// Format seconds as MM:SS for timer display
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

// Handle login: free user skips password, paid user checks password and loads allowed exams
loginBtn.addEventListener('click', function (event) {
    createLogEntry(event, 'Attempted to log in');
    isFreeUser = document.getElementById('free_user').checked;
    const studentId = studentIdInput.value.trim().toUpperCase();
    const password = passwordInput.value;
    if (!studentId) {
        showToast("Error", "Please enter Crew ID");
        return;
    }
    if (isFreeUser) {
        loginPage.classList.add('hidden');
        renderExamSelection(['auto']);
        examSelectionPage.classList.remove('hidden');
    } else {
        if (!password) {
            showToast("Error", "Please enter password");
            return;
        }
        try {
            const storedPassword = eval(studentId);
            if (storedPassword && storedPassword === password) {
                loginPage.classList.add('hidden');
                examSelectionPage.classList.remove('hidden');
                const allowedExams = userExamMap[studentId] || [];
                renderExamSelection(allowedExams);
                showToast('Welcome', `Crew ID: ${studentId}`, 'success');
            } else {
                showToast("Access Denied", "Incorrect password");
            }
        } catch (e) {
            showToast("Access Denied", "Invalid Crew ID");
        }
    }
});

// Show instructions after exam type is selected, then allow proceeding to exam
selectExamBtn.addEventListener('click', function (event) {
    const examType = document.querySelector('input[name="exam_type"]:checked').value;
    createLogEntry(event, `Selected exam: ${examType}`);
    // Hide exam page and show instructions section
    examSelectionPage.classList.add('hidden');
    // Create or show instructions modal/section
    let instrSection = document.getElementById('instructions-section');
    if (!instrSection) {
        instrSection = document.createElement('div');
        instrSection.id = 'instructions-section';
        instrSection.style.maxWidth = '700px';
        instrSection.style.margin = '30px auto';
        instrSection.style.background = '#fff';
        instrSection.style.borderRadius = '10px';
        instrSection.style.boxShadow = '0 0 10px #ccc';
        instrSection.style.padding = '24px';
        instrSection.style.textAlign = 'left';
        document.body.appendChild(instrSection);
    }
    instrSection.innerHTML = '<div style="text-align:center;font-size:1.2em;font-weight:bold;margin-bottom:10px;">Exam Instructions</div>';
    // Determine which instructions file to load based on exam structure
    let instructionsFile = 'instructions_other.html';
    // Map examType to question count (if needed, you can expand this logic)
    let qCount = 0;
    if (examType === 'auto') qCount = (typeof autoQuestions !== 'undefined') ? autoQuestions.length : 0;
    else if (examType === 'AOM23JUNE') qCount = (typeof AOM23JUNE !== 'undefined') ? AOM23JUNE.length : 0;
    else if (examType === 'generalSafetyRules') qCount = (typeof generalSafetyRules !== 'undefined') ? generalSafetyRules.length : 0;
    else if (examType === 'AOM20112022_30') qCount = (typeof AOM20112022_30 !== 'undefined') ? AOM20112022_30.length : 0;
    else if (examType === 'AOM19022023_70') qCount = (typeof AOM19022023_70 !== 'undefined') ? AOM19022023_70.length : 0;
    else if (examType === 'AOM05032023_70') qCount = (typeof AOM05032023_70 !== 'undefined') ? AOM05032023_70.length : 0;
    else if (examType === 'AOM25062023_30') qCount = (typeof AOM25062023_30 !== 'undefined') ? AOM25062023_30.length : 0;
    if (qCount === 175) instructionsFile = 'instructions_175.html';
    else if (qCount === 110) instructionsFile = 'instructions_110.html';
    // fallback: other
    fetch(instructionsFile)
        .then(response => response.text())
        .then(html => {
            instrSection.innerHTML += html;
            // Add Proceed button
            if (!document.getElementById('proceed-to-exam-btn')) {
                const proceedBtn = document.createElement('button');
                proceedBtn.id = 'proceed-to-exam-btn';
                proceedBtn.className = 'btn btn-success mt-3';
                proceedBtn.style.display = 'block';
                proceedBtn.style.margin = '30px auto 0 auto';
                proceedBtn.textContent = 'Proceed to Exam';
                proceedBtn.onclick = function (event) {
                    createLogEntry(event, 'Proceeded to Exam');
                    instrSection.style.display = 'none';
                    startExam(examType);
                };
                instrSection.appendChild(proceedBtn);
            } else {
                document.getElementById('proceed-to-exam-btn').onclick = function (event) {
                    createLogEntry(event, 'Proceeded to Exam');
                    instrSection.style.display = 'none';
                    startExam(examType);
                };
            }
            instrSection.style.display = 'block';
        });
});

// Start the exam: load questions, set timer, initialize state, and show exam page
function startExam(examType) {
    currentQuestion = 0;
    const examMap = {
        'auto': autoQuestions,
        'AOM23JUNE': AOM23JUNE,
        'generalSafetyRules': generalSafetyRules,
        'AOM20112022_30': AOM20112022_30,
        'AOM19022023_70': AOM19022023_70,
        'AOM05032023_70': AOM05032023_70,
        'AOM25062023_30': AOM25062023_30
    };
    questions = examMap[examType] || AOM23JUNE;
    questions = categorizeQuestionsByCount(questions);
    EXAM_QUESTION_COUNT = questions.length;
    if (questions.length === 175) {
        EXAM_TIME_LIMIT_MINUTES = 180;
    } else if (questions.length === 110) {
        EXAM_TIME_LIMIT_MINUTES = 120;
    } else {
        EXAM_TIME_LIMIT_MINUTES = questions.length;
    }
    TOTAL_QUESTIONS = questions.length;
    userAnswers = new Array(questions.length).fill(null);

    // ***** NEW: initialize limits & attempt counters *****
    initSectionLimits(questions.length);

    timeLeft = EXAM_TIME_LIMIT_MINUTES * 60;
    document.getElementById("tot_time").innerHTML = `${EXAM_TIME_LIMIT_MINUTES}`;
    document.getElementById("tot_questions").textContent = TOTAL_QUESTIONS;
    document.getElementById("res_questions").textContent = TOTAL_QUESTIONS;
    // Always show Crew ID, even for free user
    document.getElementById("e-id").innerHTML = "Crew ID: " + studentIdInput.value.toLocaleUpperCase();
    examSelectionPage.classList.add('hidden');
    examPage.classList.remove('hidden');
    timerInterval = setInterval(updateTimer, 1000);
    renderSectionNav();
    loadQuestion(currentQuestion);
    updateProgressBar();
}

// Update the countdown timer and handle time expiry
function updateTimer() {
    if (timeLeft <= 0) {
        clearInterval(timerInterval);
        submitExam();
        return;
    }
    timeLeft--;
    timerElement.textContent = formatTime(timeLeft);
    if (timeLeft < 300) {
        timerElement.style.color = '#dc3545';
    }
}

// Render the current question and options, update navigation buttons
function loadQuestion(index) {
    createLogEntry(null, `Loaded Question: Q${index + 1}`);
    questionsContainer.innerHTML = '';
    const questionCard = document.createElement('div');
    questionCard.className = 'question-card';
    const questionNumber = document.createElement('div');
    questionNumber.className = 'question-number mb-3 pill-qnum';
    questionNumber.innerHTML = `<span class="pill pill-q">Q${index + 1}</span> <span class="qtext">${questions[index].question}</span>`;
    questionCard.appendChild(questionNumber);

    // ***** NEW: compute lock state for this question's section *****
    const sectionKey = getSectionKey(questions[index]);
    const sectionLimit = sectionAttemptLimits[sectionKey];
    const attemptsSoFar = sectionAttempts[sectionKey] || 0;
    const isUnanswered = (userAnswers[index] === null);
    const sectionLocked = !!sectionLimit && isUnanswered && attemptsSoFar >= sectionLimit;

    // Optional small hint when locked
    if (sectionLocked) {
        const note = document.createElement('div');
        note.className = 'alert alert-warning py-1 px-2 mb-2';
        note.style.fontSize = '0.85rem';
        note.textContent = `Attempt limit reached for this section (${sectionKey}).`;
        questionCard.appendChild(note);
    }

    questions[index].options.forEach((option, optionIndex) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'form-check';
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = `question${index}`;
        input.id = `q${index}option${optionIndex}`;
        input.className = 'option-input';
        input.value = optionIndex;

        // ***** NEW: disable inputs if section is locked and this Q is still unanswered *****
        if (sectionLocked) input.disabled = true;

        if (userAnswers[index] === optionIndex) {
            input.checked = true;
        }
        const label = document.createElement('label');
        label.htmlFor = `q${index}option${optionIndex}`;
        label.className = 'option-label';
        label.innerHTML = `<span class="pill pill-opt">${optionIndex + 1}</span> <span class="option-text">${option}</span>`;

        // input.addEventListener('change', (event) => {
        //     // ***** NEW: enforce section attempt caps *****
        //     const key = getSectionKey(questions[index]);
        //     const limit = sectionAttemptLimits[key];
        //     const alreadyAnswered = (userAnswers[index] !== null);
        //     const currentAttempts = sectionAttempts[key] || 0;

        //     if (!alreadyAnswered && limit && currentAttempts >= limit) {
        //         // Block new attempts beyond limit
        //         event.preventDefault();
        //         input.checked = false;
        //         showToast("Limit Reached", `You can attempt only ${limit} question(s) in ${key}.`, 'warning');
        //         createLogEntry(event, `Attempt blocked in ${key}`, `Limit ${limit}, attempts ${currentAttempts}`);
        //         return;
        //     }

        //     // First-time answer increments section counter
        //     if (!alreadyAnswered) {
        //         sectionAttempts[key] = currentAttempts + 1;
        //     }else if(optionIndex === userAnswers[index]){
        //         input.checked = false;
        //         sectionAttempts[key] = currentAttempts - 1;
        //         optionIndex=null
        //     }

        //     userAnswers[index] = optionIndex;
        //     createLogEntry(event, `Answered Question: ${index + 1} with option ${optionIndex + 1}.`, `Correct answer is ${questions[index].correctAnswer + 1}`);
        //     updateProgressBar();
        // });

        input.addEventListener('click', (event) => {
            const key = getSectionKey(questions[index]);
            const limit = sectionAttemptLimits[key];
            const alreadyAnswered = (userAnswers[index] !== null);
            const currentAttempts = sectionAttempts[key] || 0;

            // If user clicks the same option that is already selected → unselect
            if (userAnswers[index] === optionIndex) {
                event.preventDefault();
                input.checked = false;
                userAnswers[index] = null;
                sectionAttempts[key] = Math.max(0, currentAttempts - 1);
                recomputeSectionAttempts();
                updateProgressBar();
                createLogEntry(event, `Cleared answer for Question ${index + 1}`, ``);
                return;
            }

            // Enforce section caps
            if (!alreadyAnswered && limit && currentAttempts >= limit) {
                event.preventDefault();
                input.checked = false;
                showToast("Limit Reached", `You can attempt only ${limit} question(s) in ${key}.`, 'warning');
                createLogEntry(event, `Attempt blocked in ${key}`, `Limit ${limit}, attempts ${currentAttempts}`);
                return;
            }

            // Normal case: record new selection
            userAnswers[index] = optionIndex;
            recomputeSectionAttempts();
            updateProgressBar();
            createLogEntry(event,
                `Answered Question: ${index + 1} with option ${optionIndex + 1}.`,
                `Correct answer is ${questions[index].correctAnswer + 1}`);
        });

        optionDiv.appendChild(input);
        optionDiv.appendChild(label);
        questionCard.appendChild(optionDiv);
    });

    questionsContainer.appendChild(questionCard);
    // Update navigation button states
    prevBtn.disabled = index === 0;
    if (index === questions.length - 1) {
        nextBtn.classList.add('hidden');
        submitBtn.classList.remove('hidden');
    } else {
        nextBtn.classList.remove('hidden');
        submitBtn.classList.add('hidden');
    }
    // Highlight the correct tab based on current question
    if (questions.length === 175) {
        highlightSectionTab([0, 85, 140, 175]);
    } else if (questions.length === 110) {
        highlightSectionTab([0, 70, 80, 110]);
    }
}
// Update the progress bar and answered count
function updateProgressBar() {
    const answeredCount = userAnswers.filter(answer => answer !== null).length;
    const percentage = (answeredCount / questions.length) * 100;
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = `${answeredCount}/${questions.length}`;
}

// Submit the exam, calculate score, show feedback, and email results
// Submit the exam, calculate score, show feedback, and email results
function submitExam(event) {
    clearInterval(timerInterval);
    let attempted = 0;
    let correct = 0;
    let wrong = 0;
    let negative = 0;

    // Track per-section stats
    let sectionStats = {}; // { 'Traffic': {correct, wrong, attempted}, ... }

    for (let i = 0; i < questions.length; i++) {
        if (userAnswers[i] !== null) {
            attempted++;
            const secKey = questions[i].topic || 'General';
            if (!sectionStats[secKey]) sectionStats[secKey] = { correct: 0, wrong: 0, attempted: 0 };
            sectionStats[secKey].attempted++;

            if (userAnswers[i] === questions[i].correctAnswer) {
                correct++;
                sectionStats[secKey].correct++;
            } else {
                wrong++;
                negative += 1 / 3;
                sectionStats[secKey].wrong++;
            }
        }
        // ❌ remove the old "if (attempted === 150) break;"
    }

    // let finalScore = correct - negative;
    // if (finalScore < 0) finalScore = 0;
    // finalScore = Math.round(finalScore * 100) / 100;

    let finalScore = 0;

    if (questions.length === 175) {
        // Negative marking applies
        finalScore = correct - negative;
        if (finalScore < 0) finalScore = 0; // safeguard
    } else {
        // No negative marking
        finalScore = correct;
    }

    // ✅ fixed: use dynamic total instead of hardcoded 150
    scoreElement.textContent = `${finalScore}`;
    document.getElementById("r-id").innerHTML = "Crew ID: " + studentIdInput.value.toLocaleUpperCase();
    createLogEntry(event, `Submitted exam. Score: ${finalScore}/${questions.length}`);

    // Feedback
    if (finalScore >= 90) {
        feedbackElement.className = 'feedback alert alert-success';
        feedbackElement.innerHTML = `<strong>Congratulations!</strong> You qualified with ${finalScore} marks!`;
    } else {
        feedbackElement.className = 'feedback alert alert-danger';
        feedbackElement.innerHTML = `<strong>Needs improvement.</strong> You scored ${finalScore} out of ${questions.length}.`;
    }

    // ✅ Section-wise breakdown
    let breakdownHtml = '<h5>Section-wise Performance</h5> <table class="table table-sm table-bordered table-hover">';
    breakdownHtml += ` <thead class="thead-dark"> <tr> <th>Section</th> <th>Attempted</th> <th>Correct</th> <th>Wrong</th> </tr> </thead> <tbody>`;
    Object.keys(sectionStats).forEach(sec => {
        const s = sectionStats[sec];
        breakdownHtml += `<tr> <td>${sec}</td> <td>${s.attempted}</td> <td>${s.correct}</td> <td>${s.wrong}</td> </tr>`;
    });
    breakdownHtml += '</tbody> </table>';
    sectionScoreElement.innerHTML = breakdownHtml;

    // Show correct answers for all questions
    correctAnswersContainer.innerHTML = '';
    questions.forEach((q, i) => {
        const answerDiv = document.createElement('div');
        answerDiv.className = 'mb-3 p-2 border-bottom';
        const userAnswerIndex = userAnswers[i];
        const userAnswerText = userAnswerIndex !== null ? q.options[userAnswerIndex] : 'Not Answered';
        const isCorrect = userAnswerIndex === q.correctAnswer;
        const resultColor = isCorrect ? 'green' : (userAnswerText === "Not Answered") ? 'OrangeRed' : 'Red';
        answerDiv.innerHTML = `
        <strong style="color:DarkBlue;">Q ${i + 1}:</strong> ${q.question}<br>
        <span style="color:${resultColor};"><strong>Your Answer:</strong> ${userAnswerText}</span><br>
        <strong>Correct Answer:</strong> ${q.options[q.correctAnswer]}
        <span style="float:right; font-size:smaller; color:#888;">[${q.topic || ''}]</span>
        `;
        correctAnswersContainer.appendChild(answerDiv);
    });

    // Show result page
    examPage.classList.add('hidden');
    resultPage.classList.remove('hidden');
    answersContainer.classList.add('hidden');

    // EmailJS integration: send result to admin
    emailjs.init("8QLH7j50J-Z06jiLq");
    emailjs.send("service_3y0p7zd", "template_9xwwa3n", {
        to_email: "vskptmc@gmail.com",
        student_id: studentIdInput.value.toUpperCase(),
        score: finalScore,
        total: questions.length,
        result_body: questions.map((q, i) => {
            const yourAnswer = userAnswers[i] !== null ? q.options[userAnswers[i]] : "Not Answered";
            const correctAnswer = q.options[q.correctAnswer];
            return `Q${i + 1}: ${q.question}\nYour Answer: ${yourAnswer}\nCorrect Answer: ${correctAnswer}`;
        }).join("\n------------------------\n")
    }).then(() => {
        console.log("✅ Result email sent to admin");
    }).catch((error) => {
        console.error("❌ Failed to send email:", error);
    });
    renderExamKey();
}



// --- Navigation and Action Event Listeners ---
prevBtn.addEventListener('click', (event) => {
    createLogEntry(event, 'Clicked Previous Button');
    if (currentQuestion > 0) {
        currentQuestion--;
        loadQuestion(currentQuestion);
    }
});
nextBtn.addEventListener('click', (event) => {
    createLogEntry(event, 'Clicked Next Button');
    if (currentQuestion < questions.length - 1) {
        currentQuestion++;
        loadQuestion(currentQuestion);
    }
});
submitBtn.addEventListener('click', function (event) {
    submitExam(event);
});
viewAnswersBtn.addEventListener('click', (event) => {
    createLogEntry(event, 'Toggled View Answers');
    answersContainer.classList.toggle('hidden');
});
retakeBtn.addEventListener('click', (event) => {
    createLogEntry(event, 'Clicked Retake Exam');
    // Reset state for retake
    currentQuestion = 0;
    // ***** FIXED: reset to question count, not minutes *****
    userAnswers = new Array(EXAM_QUESTION_COUNT).fill(null);
    recomputeSectionAttempts(); // keep section caps consistent on retake
    updateProgressBar();
    resultPage.classList.add('hidden');
    examPage.classList.remove('hidden');
    answersContainer.classList.add('hidden');
    timerInterval = setInterval(updateTimer, 1000);
    loadQuestion(currentQuestion);
});

// Render the exam key with clickable question numbers
function renderExamKey() {
    const container = document.getElementById("exam-key");
    container.innerHTML = `
        <div class="result-card">
            <h5>Answer Key</h5>
            <div class="table-container"></div>
            <div id="review-box"></div>
        </div>
    `;

    const tableContainer = container.querySelector(".table-container");
    const table = document.createElement("table");
    table.className = "exam-key-table";
    let row = document.createElement("tr");

    questions.forEach((q, idx) => {
        const td = document.createElement("td");
        td.textContent = idx + 1;
        td.className = "exam-key-cell";

        // Mark correct/incorrect color
        if (userAnswers[idx] === q.correctAnswer) {
            td.style.color = "green";
        } else if (userAnswers[idx] !== null) {
            td.style.color = "red";
        } else {
            td.style.color = "gray"; // unanswered
        }

        // Click → show question review
        td.addEventListener("click", () => showReviewQuestion(idx));
        row.appendChild(td);

        // wrap row every 20 questions
        if ((idx + 1) % 20 === 0) {
            table.appendChild(row);
            row = document.createElement("tr");
        }
    });

    if (row.childNodes.length > 0) table.appendChild(row);
    tableContainer.appendChild(table);
}


function showReviewQuestion(index) {
    const reviewBox = document.getElementById("review-box");
    const q = questions[index];
    const userAns = userAnswers[index];

    let html = `<h6 style="font-weight: bold;">Q${index + 1}. ${q.question}</h6><ul>`;
    q.options.forEach((opt, i) => {
        let style = "";
        let qMark = "&nbsp;&nbsp;&nbsp;";
        if (i === q.correctAnswer) {
            style = "color: green; font-weight: bold;"; qMark = "<span style='font-weight: bold; color:green'>&#10004;</span>"; // check mark
        }
        if (userAns === i && userAns !== q.correctAnswer) {
            style = "color: red;"; qMark = "<span style='font-weight: bold; color:red'>&#10006;</span>";
        }

        html += `<li style="${style}">${i + 1} &nbsp;${qMark} &nbsp; ${opt}</li>`;
    });
    html += "</ul>";

    reviewBox.innerHTML = html;
}



// Export exam results to Excel file
document.getElementById('export-btn').addEventListener('click', function (event) {
    createLogEntry(event, 'Exported results to Excel');
    const studentId = studentIdInput.value.trim().toUpperCase();
    const data = questions.map((q, i) => ({
        "Question No.": i + 1,
        "Question": q.question,
        "Your Answer": userAnswers[i] !== null ? q.options[userAnswers[i]] : 'Not Answered',
        "Correct Answer": q.options[q.correctAnswer],
        "Result": userAnswers[i] === q.correctAnswer ? "Correct" : "Wrong"
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Results");
    XLSX.writeFile(workbook, `${studentId}_Exam_Results.xlsx`);
});
