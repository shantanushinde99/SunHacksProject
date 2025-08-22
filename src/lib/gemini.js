import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

export const generatePrerequisites = async (topic) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
You are an educational AI assistant. Given a learning topic, provide a comprehensive list of prerequisite knowledge areas that a student should be familiar with before learning the main topic.

Topic: "${topic}"

Please provide exactly 5 prerequisite topics that are essential for understanding "${topic}". Each prerequisite should be:
1. A fundamental concept or skill needed
2. Specific and focused (not too broad)
3. Logically building toward the main topic

Format your response as a JSON array of strings, like this:
["Prerequisite 1", "Prerequisite 2", "Prerequisite 3", "Prerequisite 4", "Prerequisite 5"]

Only return the JSON array, no additional text or explanation.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    try {
      // Remove markdown code blocks if present
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```\s*/, '').replace(/```\s*$/, '');
      }
      
      const prerequisites = JSON.parse(cleanText.trim());
      return prerequisites;
    } catch (parseError) {
      console.error('Failed to parse prerequisites JSON:', parseError);
      // Fallback to a default set if parsing fails
      return [
        'Basic Mathematics',
        'Logical Thinking',
        'Problem Solving',
        'Computer Basics',
        'Analytical Skills'
      ];
    }
  } catch (error) {
    console.error('Error generating prerequisites:', error);
    // Return fallback prerequisites
    return [
      'Basic Mathematics',
      'Logical Thinking', 
      'Problem Solving',
      'Computer Basics',
      'Analytical Skills'
    ];
  }
};

export const generateMCQQuestions = async (topic) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
You are an educational AI assistant. Generate exactly 5 multiple-choice questions for the topic: "${topic}"

Each question should:
1. Test fundamental understanding of the topic
2. Have exactly 4 options (A, B, C, D)
3. Have only one correct answer
4. Be at an appropriate difficulty level for someone learning this topic
5. Cover different aspects of the topic
6. Include detailed explanations for learning

Format your response as a JSON array with this exact structure:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option B",
    "explanation": "Detailed explanation of why Option B is correct and what concept it demonstrates",
    "whyWrongExplanation": "Brief explanation of why the other options are incorrect",
    "topicCategory": "Specific subtopic or category this question covers",
    "difficultyLevel": "easy"
  },
  // ... 4 more questions
]

Make sure to:
- Provide clear, educational explanations that help users learn
- Categorize questions into specific subtopics
- Vary difficulty levels (easy, medium, hard)
- Explain why wrong answers are incorrect

Only return the JSON array, no additional text or explanation.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    try {
      // Remove markdown code blocks if present
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```\s*/, '').replace(/```\s*$/, '');
      }
      
      const questions = JSON.parse(cleanText.trim());
      return questions;
    } catch (parseError) {
      console.error('Failed to parse MCQ questions JSON:', parseError);
      // Fallback questions with explanations
      return [
        {
          question: `What is a key concept in ${topic}?`,
          options: ["Option A", "Option B", "Option C", "Option D"],
          correctAnswer: "Option A",
          explanation: `This is a fundamental concept related to ${topic} that forms the foundation of understanding.`,
          whyWrongExplanation: "The other options don't represent core concepts of this topic.",
          topicCategory: "Basic Concepts",
          difficultyLevel: "easy"
        },
        {
          question: `Which statement best describes ${topic}?`,
          options: ["Statement A", "Statement B", "Statement C", "Statement D"],
          correctAnswer: "Statement B",
          explanation: `This statement accurately captures the essence and main characteristics of ${topic}.`,
          whyWrongExplanation: "The other statements contain inaccuracies or incomplete information.",
          topicCategory: "Definitions",
          difficultyLevel: "medium"
        },
        {
          question: `What is the primary purpose of ${topic}?`,
          options: ["Purpose A", "Purpose B", "Purpose C", "Purpose D"],
          correctAnswer: "Purpose C",
          explanation: `The main goal and objective of ${topic} is best represented by this purpose.`,
          whyWrongExplanation: "The other purposes are either secondary or not directly related.",
          topicCategory: "Applications",
          difficultyLevel: "medium"
        },
        {
          question: `How does ${topic} relate to other concepts?`,
          options: ["Relation A", "Relation B", "Relation C", "Relation D"],
          correctAnswer: "Relation D",
          explanation: `This relationship shows how ${topic} connects with and influences other related concepts.`,
          whyWrongExplanation: "The other relationships are either incorrect or less significant.",
          topicCategory: "Relationships",
          difficultyLevel: "hard"
        },
        {
          question: `What is an important application of ${topic}?`,
          options: ["Application A", "Application B", "Application C", "Application D"],
          correctAnswer: "Application A",
          explanation: `This application demonstrates the practical use and real-world relevance of ${topic}.`,
          whyWrongExplanation: "The other applications are either less common or not directly applicable.",
          topicCategory: "Practical Applications",
          difficultyLevel: "medium"
        }
      ];
    }
  } catch (error) {
    console.error('Error generating MCQ questions:', error);
    // Return fallback questions with explanations
    return [
      {
        question: `What is a key concept in ${topic}?`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctAnswer: "Option A",
        explanation: `This is a fundamental concept related to ${topic} that forms the foundation of understanding.`,
        whyWrongExplanation: "The other options don't represent core concepts of this topic.",
        topicCategory: "Basic Concepts",
        difficultyLevel: "easy"
      },
      {
        question: `Which statement best describes ${topic}?`,
        options: ["Statement A", "Statement B", "Statement C", "Statement D"],
        correctAnswer: "Statement B",
        explanation: `This statement accurately captures the essence and main characteristics of ${topic}.`,
        whyWrongExplanation: "The other statements contain inaccuracies or incomplete information.",
        topicCategory: "Definitions",
        difficultyLevel: "medium"
      },
      {
        question: `What is the primary purpose of ${topic}?`,
        options: ["Purpose A", "Purpose B", "Purpose C", "Purpose D"],
        correctAnswer: "Purpose C",
        explanation: `The main goal and objective of ${topic} is best represented by this purpose.`,
        whyWrongExplanation: "The other purposes are either secondary or not directly related.",
        topicCategory: "Applications",
        difficultyLevel: "medium"
      },
      {
        question: `How does ${topic} relate to other concepts?`,
        options: ["Relation A", "Relation B", "Relation C", "Relation D"],
        correctAnswer: "Relation D",
        explanation: `This relationship shows how ${topic} connects with and influences other related concepts.`,
        whyWrongExplanation: "The other relationships are either incorrect or less significant.",
        topicCategory: "Relationships",
        difficultyLevel: "hard"
      },
      {
        question: `What is an important application of ${topic}?`,
        options: ["Application A", "Application B", "Application C", "Application D"],
        correctAnswer: "Application A",
        explanation: `This application demonstrates the practical use and real-world relevance of ${topic}.`,
        whyWrongExplanation: "The other applications are either less common or not directly applicable.",
        topicCategory: "Practical Applications",
        difficultyLevel: "medium"
      }
    ];
  }
};

export const generateEvaluationReport = async (results, topics) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Create a summary of results for the AI
    const resultsSummary = topics.map(topic => {
      const result = results[topic];
      return `${topic}: ${result.correct}/${result.total} (${result.passed ? 'PASSED' : 'FAILED'})`;
    }).join('\n');

    const totalTopics = topics.length;
    const passedTopics = topics.filter(topic => results[topic].passed).length;
    const failedTopics = totalTopics - passedTopics;

    const prompt = `
You are an educational AI assistant. Based on the following evaluation results, provide a personalized report with a general remark and recommendations.

Evaluation Results:
${resultsSummary}

Summary:
- Total topics evaluated: ${totalTopics}
- Topics passed: ${passedTopics}
- Topics failed: ${failedTopics}
- Passing criteria: 4/5 questions correct per topic

Please provide:
1. A general remark about the student's performance (2-3 sentences)
2. Specific recommendations for improvement (if any failures) or next steps (if all passed)

Format your response as JSON:
{
  "remark": "Your general remark here...",
  "recommendations": ["Recommendation 1", "Recommendation 2", ...]
}

Only return the JSON, no additional text.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    try {
      // Remove markdown code blocks if present
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```\s*/, '').replace(/```\s*$/, '');
      }
      
      const report = JSON.parse(cleanText.trim());
      return report;
    } catch (parseError) {
      console.error('Failed to parse evaluation report JSON:', parseError);
      // Fallback report
      return {
        remark: `You completed the evaluation with ${passedTopics} out of ${totalTopics} topics passed. ${failedTopics > 0 ? 'Focus on the failed topics to strengthen your foundation.' : 'Great job on passing all topics!'}`,
        recommendations: failedTopics > 0 
          ? ["Review the topics you didn't pass", "Practice more questions on weak areas", "Seek additional resources for difficult concepts"]
          : ["Continue to the main learning material", "You have a solid foundation in the prerequisites"]
      };
    }
  } catch (error) {
    console.error('Error generating evaluation report:', error);
    // Return fallback report
    const passedTopics = topics.filter(topic => results[topic].passed).length;
    const totalTopics = topics.length;
    const failedTopics = totalTopics - passedTopics;
    
    return {
      remark: `You completed the evaluation with ${passedTopics} out of ${totalTopics} topics passed. ${failedTopics > 0 ? 'Focus on the failed topics to strengthen your foundation.' : 'Great job on passing all topics!'}`,
      recommendations: failedTopics > 0 
        ? ["Review the topics you didn't pass", "Practice more questions on weak areas", "Seek additional resources for difficult concepts"]
        : ["Continue to the main learning material", "You have a solid foundation in the prerequisites"]
    };
  }
};

export const generateSubtopics = async (topic) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
You are an educational AI assistant. For the topic "${topic}", generate a list of 4-6 key subtopics that need to be covered for a comprehensive understanding.

Each subtopic should be:
1. A specific aspect or component of the main topic
2. Logically sequenced for learning
3. Essential for understanding the overall topic
4. Concise and clear

Format your response as a JSON array of strings:
["Subtopic 1", "Subtopic 2", "Subtopic 3", "Subtopic 4", "Subtopic 5"]

Only return the JSON array, no additional text.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    try {
      // Remove markdown code blocks if present
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```\s*/, '').replace(/```\s*$/, '');
      }
      
      const subtopics = JSON.parse(cleanText.trim());
      return subtopics;
    } catch (parseError) {
      console.error('Failed to parse subtopics JSON:', parseError);
      // Fallback subtopics
      return [
        `Introduction to ${topic}`,
        `Key Concepts in ${topic}`,
        `Applications of ${topic}`,
        `Advanced Topics in ${topic}`
      ];
    }
  } catch (error) {
    console.error('Error generating subtopics:', error);
    // Return fallback subtopics
    return [
      `Introduction to ${topic}`,
      `Key Concepts in ${topic}`,
      `Applications of ${topic}`,
      `Advanced Topics in ${topic}`
    ];
  }
};

export const generateSubtopicContent = async (subtopic) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
You are an educational AI assistant. Generate educational content for the subtopic: "${subtopic}"

The content should be:
1. Approximately 300 words
2. Clear and easy to understand
3. Educational and informative
4. Well-structured with good flow
5. Engaging for learners

Provide comprehensive coverage of the subtopic while keeping it accessible. Use examples where helpful.

Return only the content text, no additional formatting or explanations.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text.trim();
  } catch (error) {
    console.error('Error generating subtopic content:', error);
    // Return fallback content
    return `This section covers ${subtopic}. This is an important concept that forms a fundamental part of understanding the broader topic. The key principles and applications will be explained to help you build a solid foundation in this area.`;
  }
};

export const rephraseContent = async (content) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
You are an educational AI assistant. Rephrase the following content to make it simpler and easier to understand while maintaining all the key information:

"${content}"

The rephrased content should:
1. Use simpler vocabulary and shorter sentences
2. Be more accessible to beginners
3. Maintain the same educational value
4. Keep approximately the same length
5. Use more basic language and clearer explanations

Return only the rephrased content, no additional text.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text.trim();
  } catch (error) {
    console.error('Error rephrasing content:', error);
    // Return original content if rephrasing fails
    return content;
  }
};

export const answerQuestion = async (question) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
You are an educational AI assistant. Answer the following question in a clear, helpful, and educational manner:

"${question}"

Provide a comprehensive but concise answer that:
1. Directly addresses the question
2. Is easy to understand
3. Includes relevant examples if helpful
4. Is educational and informative
5. Is approximately 100-200 words

Return only the answer, no additional text.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text.trim();
  } catch (error) {
    console.error('Error answering question:', error);
    // Return fallback answer
    return "I'm sorry, I couldn't generate an answer to your question at the moment. Please try rephrasing your question or ask for help from your instructor.";
  }
};

// Generate flashcards for a given topic
export const detectTopicFromContent = async (markdownContent) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
You are an educational AI assistant. Analyze the following extracted content and determine the primary topic or subject matter.

Content:
"""${markdownContent.substring(0, 4000)}""" ${markdownContent.length > 4000 ? '...(truncated)' : ''}

Based on this content, provide:
1. The main topic/subject (concise, 2-5 words)
2. A brief description of what the content covers (1-2 sentences)
3. Up to 3 key subtopics or concepts mentioned
4. The academic level (elementary, middle school, high school, undergraduate, graduate, professional)
5. Suggested learning approach (theoretical, practical, problem-solving, mixed)

Format your response as JSON:
{
  "topic": "Main Topic Name",
  "description": "Brief description of content",
  "subtopics": ["Subtopic 1", "Subtopic 2", "Subtopic 3"],
  "level": "academic level",
  "approach": "suggested approach"
}

Only return the JSON, no additional text.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      // Remove markdown code blocks if present
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```\s*/, '').replace(/```\s*$/, '');
      }
      
      const topicInfo = JSON.parse(cleanText.trim());
      return topicInfo;
    } catch (parseError) {
      console.error('Failed to parse topic detection JSON:', parseError);
      // Fallback topic detection
      return {
        topic: "General Study Material",
        description: "Educational content extracted from uploaded documents.",
        subtopics: ["Key Concepts", "Applications", "Examples"],
        level: "undergraduate",
        approach: "mixed"
      };
    }
  } catch (error) {
    console.error('Error detecting topic from content:', error);
    // Return fallback topic info
    return {
      topic: "Uploaded Content",
      description: "Content extracted from your uploaded files.",
      subtopics: ["Main Concepts"],
      level: "undergraduate",
      approach: "mixed"
    };
  }
};

export const generateFlashcards = async (topic) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
You are an educational AI assistant. For the topic "${topic}", generate exactly 8-12 flashcards that cover the key concepts, terms, and important information.

Each flashcard should have:
1. A "question" - This can be a term, concept, or question that needs to be explained
2. A "answer" - A brief, concise, but comprehensive explanation (50-100 words)

The flashcards should:
- Cover the most important aspects of the topic
- Be educational and informative
- Progress from basic to more advanced concepts
- Use clear, simple language
- Include practical examples when helpful

Format your response as a JSON array of objects:
[
  {
    "question": "What is [concept/term]?",
    "answer": "Brief but comprehensive explanation..."
  },
  {
    "question": "Another key concept or term",
    "answer": "Another brief explanation..."
  }
]

Only return the JSON array, no additional text or explanation.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the JSON response
    try {
      // Remove markdown code blocks if present
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```\s*/, '').replace(/```\s*$/, '');
      }
      
      const flashcards = JSON.parse(cleanText.trim());
      return flashcards;
    } catch (parseError) {
      console.error('Failed to parse flashcards JSON:', parseError);
      // Fallback flashcards
      return [
        {
          question: `What is ${topic}?`,
          answer: `${topic} is an important concept that requires understanding of its fundamental principles and applications. It involves key components that work together to achieve specific outcomes.`
        },
        {
          question: `Why is ${topic} important?`,
          answer: `${topic} is important because it provides essential knowledge and skills that are widely applicable in various contexts and forms the foundation for more advanced learning.`
        },
        {
          question: `What are the key components of ${topic}?`,
          answer: `The key components of ${topic} include several fundamental elements that work together systematically to create a comprehensive understanding of the subject.`
        }
      ];
    }
  } catch (error) {
    console.error('Error generating flashcards:', error);
    // Return fallback flashcards
    return [
      {
        question: `What is ${topic}?`,
        answer: `${topic} is an important concept that requires understanding of its fundamental principles and applications.`
      }
    ];
  }
};
