import React, { useState, useEffect, useCallback } from 'react';
import { generateFlashcards } from '../lib/gemini';
import './FastLearningSession.css';

const FastLearningSession = ({ topic: initialTopic = '', onBack }) => {
  const [topic] = useState(initialTopic);
  const [currentPhase, setCurrentPhase] = useState('flashcards'); // 'flashcards', 'evaluation', 'completed'
  const [flashcards, setFlashcards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studiedCards, setStudiedCards] = useState(new Set());
  const [loading, setLoading] = useState(false);
  
  // Evaluation state
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [evaluationResults, setEvaluationResults] = useState(null);

  // Generate 10 flashcards for fast learning
  const generateFastFlashcards = async (topicName) => {
    try {
      // Use the existing generateFlashcards function and limit to 10
      const cards = await generateFlashcards(topicName);
      return cards.slice(0, 10); // Ensure exactly 10 cards


    } catch (error) {
      console.error('Error generating fast flashcards:', error);
      // Fallback flashcards
      return Array.from({ length: 10 }, (_, index) => ({
        question: `Key Concept ${index + 1} of ${topicName}`,
        answer: `This is an important concept related to ${topicName} that you should understand.`
      }));
    }
  };

  // Generate 15 MCQ questions for evaluation
  const generateFastMCQQuestions = async (topicName) => {
    try {
      // Generate multiple batches to get 15 questions
      const batch1 = await import('../lib/gemini').then(module => module.generateMCQQuestions(topicName));
      const batch2 = await import('../lib/gemini').then(module => module.generateMCQQuestions(topicName));
      const batch3 = await import('../lib/gemini').then(module => module.generateMCQQuestions(topicName));

      const allQuestions = [...batch1, ...batch2, ...batch3];
      return allQuestions.slice(0, 15); // Take exactly 15 questions
    } catch (error) {
      console.error('Error generating fast MCQ questions:', error);
      // Fallback questions
      return Array.from({ length: 15 }, (_, index) => ({
        question: `Question ${index + 1} about ${topicName}?`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: ["Option A", "Option B", "Option C", "Option D"][index % 4]
      }));
    }
  };

  // Load flashcards when component mounts
  const loadFlashcards = useCallback(async () => {
    if (!topic.trim()) return;
    
    setLoading(true);
    try {
      const cards = await generateFastFlashcards(topic);
      setFlashcards(cards);
    } catch (error) {
      console.error('Error loading flashcards:', error);
    } finally {
      setLoading(false);
    }
  }, [topic]);

  useEffect(() => {
    if (initialTopic && initialTopic.trim()) {
      loadFlashcards();
    }
  }, [initialTopic, loadFlashcards]);

  // Flashcard navigation
  const handleCardClick = () => {
    if (!isFlipped) {
      setIsFlipped(true);
      setStudiedCards(prev => new Set([...prev, currentCardIndex]));
    }
  };

  const handleNextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  };

  // Start evaluation phase
  const handleStartEvaluation = async () => {
    setLoading(true);
    try {
      const evalQuestions = await generateFastMCQQuestions(topic);
      setQuestions(evalQuestions);
      setCurrentPhase('evaluation');
      setCurrentQuestionIndex(0);
      setAnswers({});
      setSelectedAnswer('');
    } catch (error) {
      console.error('Error starting evaluation:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle answer selection
  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
  };

  // Handle next question
  const handleNextQuestion = () => {
    // Save answer
    const questionKey = currentQuestionIndex;
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    
    setAnswers(prev => ({
      ...prev,
      [questionKey]: {
        question: currentQuestion.question,
        selectedAnswer,
        correctAnswer: currentQuestion.correctAnswer,
        isCorrect
      }
    }));

    // Move to next question or complete evaluation
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer('');
    } else {
      completeEvaluation();
    }
  };

  // Complete evaluation
  const completeEvaluation = () => {
    const finalAnswers = {
      ...answers,
      [currentQuestionIndex]: {
        question: questions[currentQuestionIndex].question,
        selectedAnswer,
        correctAnswer: questions[currentQuestionIndex].correctAnswer,
        isCorrect: selectedAnswer === questions[currentQuestionIndex].correctAnswer
      }
    };

    const correctCount = Object.values(finalAnswers).filter(answer => answer.isCorrect).length;
    const totalQuestions = questions.length;
    const percentage = Math.round((correctCount / totalQuestions) * 100);

    setEvaluationResults({
      correct: correctCount,
      total: totalQuestions,
      percentage,
      passed: percentage >= 60 // 60% passing threshold
    });

    setCurrentPhase('completed');
  };

  const allCardsStudied = studiedCards.size === flashcards.length;
  const progress = flashcards.length > 0 ? (studiedCards.size / flashcards.length) * 100 : 0;

  // Render loading state
  if (loading) {
    return (
      <div className="fast-learning-container">
        <div className="loading-section">
          <div className="loading-spinner"></div>
          <p>Preparing your fast learning session...</p>
        </div>
      </div>
    );
  }

  // Render evaluation phase
  if (currentPhase === 'evaluation') {
    const currentQuestion = questions[currentQuestionIndex];
    const questionProgress = ((currentQuestionIndex + 1) / questions.length) * 100;

    return (
      <div className="fast-learning-container">
        <div className="nav-menu" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </div>

        <h1 className="title">Fast Learning Evaluation</h1>
        <div className="topic-display">Topic: {topic}</div>

        <div className="evaluation-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${questionProgress}%` }}></div>
          </div>
          <span className="progress-text">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
        </div>

        {currentQuestion && (
          <div className="question-section">
            <div className="question-card">
              <h3>{currentQuestion.question}</h3>
              <div className="options-grid">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    className={`option-button ${selectedAnswer === option ? 'selected' : ''}`}
                    onClick={() => handleAnswerSelect(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="next-question-button"
              onClick={handleNextQuestion}
              disabled={!selectedAnswer}
            >
              {currentQuestionIndex === questions.length - 1 ? 'Complete Evaluation' : 'Next Question'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Render completion phase
  if (currentPhase === 'completed') {
    return (
      <div className="fast-learning-container">
        <div className="nav-menu" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </div>

        <h1 className="title">Fast Learning Complete!</h1>
        
        <div className="completion-section">
          <div className="completion-icon">
            {evaluationResults?.passed ? '🎉' : '📚'}
          </div>
          
          <div className="results-summary">
            <h2>Your Results</h2>
            <div className="score-display">
              <span className="score-number">{evaluationResults?.percentage}%</span>
              <span className="score-details">
                {evaluationResults?.correct} out of {evaluationResults?.total} correct
              </span>
            </div>
            
            <div className={`result-status ${evaluationResults?.passed ? 'passed' : 'needs-improvement'}`}>
              {evaluationResults?.passed ? 
                'Great job! You have a good understanding of the topic.' :
                'Keep studying! Review the material and try again.'
              }
            </div>
          </div>

          <button className="restart-button" onClick={() => setCurrentPhase('flashcards')}>
            Study Again
          </button>
        </div>
      </div>
    );
  }

  // Render flashcards phase (default)
  return (
    <div className="fast-learning-container">
      <div className="nav-menu" onClick={onBack}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </div>

      <h1 className="title">Fast Learning</h1>
      <div className="topic-display">Topic: {topic}</div>

      {flashcards.length > 0 && (
        <>
          <div className="progress-section">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="progress-text">
              {studiedCards.size} of {flashcards.length} cards studied
            </span>
          </div>

          <div className="flashcard-section">
            <div className="flashcard-wrapper">
              <div 
                className={`flashcard ${isFlipped ? 'flipped' : ''}`}
                onClick={handleCardClick}
              >
                <div className="flashcard-front">
                  <div className="card-number">
                    {currentCardIndex + 1} / {flashcards.length}
                  </div>
                  <div className="card-content">
                    <h3>{flashcards[currentCardIndex]?.question}</h3>
                    <div className="tap-instruction">
                      {!isFlipped && <span>👆 Tap to reveal answer</span>}
                    </div>
                  </div>
                </div>
                <div className="flashcard-back">
                  <div className="card-number">
                    {currentCardIndex + 1} / {flashcards.length}
                  </div>
                  <div className="card-content">
                    <div className="answer-content">
                      {flashcards[currentCardIndex]?.answer}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="card-navigation">
              <button 
                onClick={handlePrevCard} 
                disabled={currentCardIndex === 0}
                className="nav-button"
              >
                ← Previous
              </button>
              
              <button 
                onClick={handleNextCard} 
                disabled={currentCardIndex === flashcards.length - 1}
                className="nav-button"
              >
                Next →
              </button>
            </div>

            {allCardsStudied && (
              <div className="completion-actions">
                <button 
                  onClick={handleStartEvaluation}
                  className="start-evaluation-button"
                >
                  Start Evaluation (15 Questions)
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default FastLearningSession;
