# Online Exam Portal

A **web-based examination system** that allows users to take multiple-choice question (MCQ) exams with a timer, progress tracking, and results display. This system is designed for simplicity and speed, making it suitable for mock tests, practice exams, and educational assessments.

## 📌 Features

- **MCQ Exam Interface** – Displays questions one by one with multiple-choice options and a rich question palette.
- **Timer Functionality** – Exam duration countdown with auto-submit on time expiry.
- **Progress Tracking** – Shows how many questions are answered, unanswered, marked for review, and not visited.
- **Result Calculation** – Instantly calculates right/wrong answers and computes negative marks based on the exam type.
- **Role-based Login System** – Supports ID and password authentication, mapping candidates strictly to allocated exams.
- **Data-Driven Questions** – Loads questions from `data.js` for easy modification without backend architecture.
- **Security Features** – JavaScript-based disabling of text selection, right-click, and copying. Custom alert lockouts.

## 🗂 Project Structure

```text
Online Exam/
│── index.html                  # Main exam interface (Login & Exam UI)
│── popup_instructions.html     # Pre-exam instructions modal popup
│── instructions_*.html         # Various exam-specific instruction screens
│── main.css                    # Styling and layout properties
│── main.js                     # Core exam execution logic and UI handling
│── data.js                     # Question bank arrays (JSON format)
│── disableCopy.js              # Script to prevent copying exam content
│── users.reg                   # User database containing allotted exams and credentials
│── user.log                    # Local tracking logs
│── img/                        # Image assets and candidate photos
```

## 🚀 Getting Started

### 1️⃣ Prerequisites
- Any modern web browser (Google Chrome, Firefox, Microsoft Edge, Safari)
- Works completely client-side. No server or compilation required.

### 2️⃣ Installation
1. Download or clone this repository anywhere on your PC.
2. Ensure all files remain in the original folder to maintain the directory structure.
3. Double-click or open `index.html` in your browser to start.

## ⚙️ Customization

- **Edit Questions:**  
  Open `data.js` and modify the JSON arrays to update questions, options, and answers.
  
- **Change Exam Settings:**  
  Inside `index.html` and `main.js`, update the conditional logic for specific exam codes (e.g., modifying exam duration based on the question length).

- **Manage Users:**  
  Modify the `users.reg` file to add new candidates, their passwords, photos, and an array of explicitly assigned `exams`. Using the 'ALL' flag explicitly grants all access.

## 🛡 Security Notes
- Since this is a front-end-only project, questions and answers are stored locally in `data.js`. For completely secure, high-stakes remote administration, this client-side architecture should be migrated to server-side processing to hide the answers. 
- Local scripts prevent basic copying strategies but users can still inspect raw code via devtools.

## 📄 License
This project is open-source under the MIT License.
