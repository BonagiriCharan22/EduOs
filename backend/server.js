// // // const express = require('express');
// // // const dotenv = require('dotenv');
// // // const { GoogleGenerativeAI } = require('@google/generative-ai');
// // // const { connectDB, User, Session, StudyPlan } = require('./db');

// // // dotenv.config();
// // // const app = express();

// // // // ===== MIDDLEWARE - CORS FIRST =====
// // // // app.use((req, res, next) => {
// // // //   res.header('Access-Control-Allow-Origin', '*');
// // // //   res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
// // // //   res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');

// // // //   if (req.method === 'OPTIONS') {
// // // //     return res.sendStatus(200);
// // // //   }

// // // //   next();
// // // // });
// // // const cors = require('cors');

// // // app.use(cors());
// // // app.use(express.json());

// // // connectDB();
// // // const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// // // // ===== ANALYTICS =====
// // // const analyzePerformance = async (userId) => {
// // //   const sessions = await Session.find({ userId }).sort({ timestamp: -1 }).limit(50);
// // //   if (sessions.length === 0) return null;
// // //   const byTopic = {};
// // //   sessions.forEach((s) => {
// // //     if (!byTopic[s.topic]) byTopic[s.topic] = [];
// // //     byTopic[s.topic].push(s);
// // //   });
// // //   const topicAnalysis = Object.entries(byTopic).map(([topic, records]) => {
// // //     const accuracy = records.reduce((sum, r) => sum + (r.correct / r.questionsAttempted), 0) / records.length;
// // //     const trend = records.length >= 2 ? (records[0].correct / records[0].questionsAttempted) - (records[1].correct / records[1].questionsAttempted) : 0;
// // //     const avgTime = records.reduce((sum, r) => sum + r.timeSpent, 0) / records.length;
// // //     const isWeak = accuracy < 0.6;
// // //     return { topic, accuracy, trend, avgTime, isWeak };
// // //   });
// // //   return { topicAnalysis, totalSessions: sessions.length };
// // // };

// // // // ===== STUDY PLAN GENERATION =====
// // // const generateStudyPlan = async (userId) => {
// // //   const user = await User.findOne({ userId });
// // //   const analysis = await analyzePerformance(userId);
// // //   if (!analysis) return null;
// // //   const daysUntilExam = Math.ceil((new Date(user.examDate) - new Date()) / (1000 * 60 * 60 * 24));
// // //   const deadlineWeight = Math.min(1, (60 - daysUntilExam) / 60);
// // //   const priorityTopics = analysis.topicAnalysis.map((t) => ({
// // //     ...t,
// // //     priorityScore: (1 - t.accuracy) * 0.4 + deadlineWeight * 0.3 + Math.max(0, -t.trend) * 0.3,
// // //   })).sort((a, b) => b.priorityScore - a.priorityScore);
// // //   const dailyPlan = [];
// // //   const topicsToStudy = priorityTopics.slice(0, Math.min(3, priorityTopics.length));
// // //   for (let day = 1; day <= 7; day++) {
// // //     const todayTopics = topicsToStudy.map((t) => ({
// // //       topic: t.topic,
// // //       minTime: Math.max(30, Math.ceil(t.avgTime / 60)) * (1 + t.priorityScore),
// // //       focusAreas: t.isWeak ? ['fundamentals', 'practice'] : ['advanced', 'optimization'],
// // //     }));
// // //     dailyPlan.push({
// // //       day,
// // //       date: new Date(Date.now() + day * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
// // //       topics: todayTopics,
// // //       completed: false,
// // //     });
// // //   }
// // //   const plan = new StudyPlan({
// // //     userId,
// // //     plan: dailyPlan,
// // //     topicPriorities: priorityTopics,
// // //   });
// // //   await plan.save();
// // //   return { dailyPlan, topicPriorities: priorityTopics, daysUntilExam };
// // // };

// // // // ===== RISK ASSESSMENT =====
// // // const assessRisk = async (userId) => {
// // //   const analysis = await analyzePerformance(userId);
// // //   if (!analysis) return { level: 'MEDIUM', message: 'Insufficient data', score: 0 };
// // //   const avgAccuracy = analysis.topicAnalysis.reduce((sum, t) => sum + t.accuracy, 0) / analysis.topicAnalysis.length;
// // //   const weakTopics = analysis.topicAnalysis.filter((t) => t.isWeak).length;
// // //   const negativesTrending = analysis.topicAnalysis.filter((t) => t.trend < -0.1).length;
// // //   const riskScore = avgAccuracy * 0.5 + (weakTopics / analysis.topicAnalysis.length) * 0.3 + (negativesTrending / analysis.topicAnalysis.length) * 0.2;
// // //   let level = 'LOW';
// // //   let message = 'You\'re on track!';
// // //   if (riskScore > 0.6) {
// // //     level = 'HIGH';
// // //     message = '⚠️ Urgent: Multiple weak areas detected. Increase study time now.';
// // //   } else if (riskScore > 0.35) {
// // //     level = 'MEDIUM';
// // //     message = 'Focus on weak topics. You have time to improve.';
// // //   }
// // //   return { level, message, score: Math.round(riskScore * 100) };
// // // };

// // // // ===== API ROUTES =====
// // // app.post('/user/init', async (req, res) => {
// // //   try {
// // //     console.log('✅ POST /user/init called');
// // //     const { name, topics, examDate } = req.body;
// // //     const userId = Date.now().toString();
// // //     const user = new User({ id: userId, name, topics, examDate });
// // //     await user.save();
// // //     console.log('✅ User created:', userId);
// // //     res.json({ success: true, userId, message: 'Profile created' });
// // //   } catch (err) {
// // //     console.error('❌ Error:', err.message);
// // //     res.status(500).json({ error: err.message });
// // //   }
// // // });

// // // app.post('/session/add', async (req, res) => {
// // //   try {
// // //     const { userId, topic, accuracy, timeSpent, questionsAttempted, correct } = req.body;
// // //     const session = new Session({ userId, topic, accuracy, timeSpent, questionsAttempted, correct });
// // //     await session.save();
// // //     res.json({ success: true, message: 'Session recorded' });
// // //   } catch (err) {
// // //     res.status(500).json({ error: err.message });
// // //   }
// // // });

// // // app.get('/dashboard/:userId', async (req, res) => {
// // //   try {
// // //     const { userId } = req.params;
// // //     const analysis = await analyzePerformance(userId);
// // //     const risk = await assessRisk(userId);
// // //     if (!analysis) {
// // //       return res.json({ accuracy: null, weakTopics: [], risk, totalSessions: 0, message: 'Start a learning session to see analytics' });
// // //     }
// // //     res.json({
// // //       accuracy: Math.round((analysis.topicAnalysis.reduce((sum, t) => sum + t.accuracy, 0) / analysis.topicAnalysis.length) * 100),
// // //       topicBreakdown: analysis.topicAnalysis,
// // //       weakTopics: analysis.topicAnalysis.filter((t) => t.isWeak).map((t) => t.topic),
// // //       risk,
// // //       totalSessions: analysis.totalSessions,
// // //     });
// // //   } catch (err) {
// // //     res.status(500).json({ error: err.message });
// // //   }
// // // });

// // // app.get('/planner/:userId', async (req, res) => {
// // //   try {
// // //     const { userId } = req.params;
// // //     const plan = await StudyPlan.findOne({ userId }).sort({ generatedAt: -1 });
// // //     if (!plan) {
// // //       const newPlan = await generateStudyPlan(userId);
// // //       return res.json(newPlan || { message: 'Complete some sessions first' });
// // //     }
// // //     res.json({ dailyPlan: plan.plan, topicPriorities: plan.topicPriorities });
// // //   } catch (err) {
// // //     res.status(500).json({ error: err.message });
// // //   }
// // // });

// // // app.post('/tutor', async (req, res) => {
// // //   try {
// // //     const { userId, topic, question } = req.body;
// // //     const analysis = await analyzePerformance(userId);
// // //     const weaknessContext = analysis ? `The student has ${Math.round(analysis.topicAnalysis.find((t) => t.topic === topic)?.accuracy * 100) || 'unknown'}% accuracy in ${topic}.` : '';
// // //     const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
// // //     const prompt = `You are an expert tutor helping a student understand ${topic}.\n\nContext: ${weaknessContext}\n\nStudent's question: "${question}"\n\nProvide:\n1. A clear, simple explanation\n2. A concrete example\n3. One practical tip\n\nKeep it concise (under 300 words). Use a friendly, encouraging tone.`;
// // //     const result = await model.generateContent(prompt);
// // //     const response = result.response.text();
// // //     res.json({ success: true, response, topic });
// // //   } catch (err) {
// // //     res.status(500).json({ error: err.message });
// // //   }
// // // });

// // // app.get('/regenerate-plan/:userId', async (req, res) => {
// // //   try {
// // //     const { userId } = req.params;
// // //     await StudyPlan.deleteMany({ userId });
// // //     const newPlan = await generateStudyPlan(userId);
// // //     res.json(newPlan || { message: 'Insufficient data' });
// // //   } catch (err) {
// // //     res.status(500).json({ error: err.message });
// // //   }
// // // });

// // // // ===== START SERVER =====
// // // const PORT = process.env.PORT || 5000;
// // // app.listen(PORT, () => {
// // //   console.log(`\n🚀 EduOS Server Running on Port ${PORT}`);
// // //   console.log(`✅ MongoDB Connected`);
// // //   console.log(`✅ CORS Enabled for All Origins\n`);
// // // });
// // const express = require('express');
// // const dotenv = require('dotenv');
// // const { GoogleGenerativeAI } = require('@google/generative-ai');
// // const { connectDB, User, Session, StudyPlan } = require('./db');

// // dotenv.config();
// // const app = express();

// // const cors = require('cors');
// // app.use(cors());
// // app.use(express.json());

// // connectDB();
// // const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// // // ===== ANALYTICS =====
// // const analyzePerformance = async (userId) => {
// //   const sessions = await Session.find({ userId }).sort({ timestamp: -1 }).limit(50);

// //   // ✅ FIX: avoid null
// //   if (sessions.length === 0) {
// //     return { topicAnalysis: [], totalSessions: 0 };
// //   }

// //   const byTopic = {};
// //   sessions.forEach((s) => {
// //     if (!byTopic[s.topic]) byTopic[s.topic] = [];
// //     byTopic[s.topic].push(s);
// //   });

// //   const topicAnalysis = Object.entries(byTopic).map(([topic, records]) => {
// //     const accuracy =
// //       records.reduce((sum, r) => sum + (r.correct / r.questionsAttempted), 0) /
// //       records.length;

// //     const trend =
// //       records.length >= 2
// //         ? records[0].correct / records[0].questionsAttempted -
// //           records[1].correct / records[1].questionsAttempted
// //         : 0;

// //     const avgTime =
// //       records.reduce((sum, r) => sum + r.timeSpent, 0) / records.length;

// //     const isWeak = accuracy < 0.6;

// //     return { topic, accuracy, trend, avgTime, isWeak };
// //   });

// //   return { topicAnalysis, totalSessions: sessions.length };
// // };

// // // ===== STUDY PLAN GENERATION =====
// // const generateStudyPlan = async (userId) => {
// //   const user = await User.findOne({ id:userId });
// //   const analysis = await analyzePerformance(userId);

// //   // ✅ AI FALLBACK (NEW USERS)
// //   if (!analysis || analysis.topicAnalysis.length === 0) {
// //     try {
// //       // const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
// //       const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });


// //       const prompt = `
// // Create a 7-day study plan.

// // Student Name: ${user.name}
// // Exam Date: ${user.examDate}
// // Topics: ${user.topics.join(', ')}

// // Rules:
// // - Beginner friendly
// // - Cover all topics
// // - Daily plan
// // - Include time + focus

// // Return ONLY JSON:
// // [
// //   {
// //     "day": 1,
// //     "topics": [
// //       { "topic": "DSA", "hours": 2, "focus": ["concepts", "practice"] }
// //     ]
// //   }
// // ]
// // `;

// //       const result = await model.generateContent(prompt);

// //       let text = result.response.text();

// //       // clean response
// //       text = text.replace(/```json/g, '').replace(/```/g, '');

// //       let aiPlan;
// //       try {
// //         aiPlan = JSON.parse(text);
// //       } catch {
// //         aiPlan = [];
// //       }

// //       return {
// //         dailyPlan: aiPlan,
// //         topicPriorities: [],
// //         aiGenerated: true,
// //         message: "AI-generated plan (no session data)",
// //       };
// //     } catch (err) {
// //       console.error("AI Plan Error:", err.message);
// //       return {
// //         dailyPlan: [],
// //         topicPriorities: [],
// //         aiGenerated: true,
// //         message: "Failed to generate AI plan",
// //       };
// //     }
// //   }

// //   // ✅ EXISTING LOGIC (UNCHANGED)
// //   const daysUntilExam = Math.ceil(
// //     (new Date(user.examDate) - new Date()) / (1000 * 60 * 60 * 24)
// //   );

// //   const deadlineWeight = Math.min(1, (60 - daysUntilExam) / 60);

// //   const priorityTopics = analysis.topicAnalysis
// //     .map((t) => ({
// //       ...t,
// //       priorityScore:
// //         (1 - t.accuracy) * 0.4 +
// //         deadlineWeight * 0.3 +
// //         Math.max(0, -t.trend) * 0.3,
// //     }))
// //     .sort((a, b) => b.priorityScore - a.priorityScore);

// //   const dailyPlan = [];
// //   const topicsToStudy = priorityTopics.slice(0, Math.min(3, priorityTopics.length));

// //   for (let day = 1; day <= 7; day++) {
// //     const todayTopics = topicsToStudy.map((t) => ({
// //       topic: t.topic,
// //       minTime:
// //         Math.max(30, Math.ceil(t.avgTime / 60)) * (1 + t.priorityScore),
// //       focusAreas: t.isWeak
// //         ? ['fundamentals', 'practice']
// //         : ['advanced', 'optimization'],
// //     }));

// //     dailyPlan.push({
// //       day,
// //       date: new Date(Date.now() + day * 86400000)
// //         .toISOString()
// //         .split('T')[0],
// //       topics: todayTopics,
// //       completed: false,
// //     });
// //   }

// //   const plan = new StudyPlan({
// //     userId,
// //     plan: dailyPlan,
// //     topicPriorities: priorityTopics,
// //   });

// //   await plan.save();

// //   return {
// //     dailyPlan,
// //     topicPriorities: priorityTopics,
// //     daysUntilExam,
// //   };
// // };

// // // ===== RISK ASSESSMENT =====
// // const assessRisk = async (userId) => {
// //   const analysis = await analyzePerformance(userId);

// //   if (!analysis || analysis.topicAnalysis.length === 0) {
// //     return { level: 'MEDIUM', message: 'Insufficient data', score: 0 };
// //   }

// //   const avgAccuracy =
// //     analysis.topicAnalysis.reduce((sum, t) => sum + t.accuracy, 0) /
// //     analysis.topicAnalysis.length;

// //   const weakTopics = analysis.topicAnalysis.filter((t) => t.isWeak).length;

// //   const negativesTrending = analysis.topicAnalysis.filter(
// //     (t) => t.trend < -0.1
// //   ).length;

// //   const riskScore =
// //     avgAccuracy * 0.5 +
// //     (weakTopics / analysis.topicAnalysis.length) * 0.3 +
// //     (negativesTrending / analysis.topicAnalysis.length) * 0.2;

// //   let level = 'LOW';
// //   let message = "You're on track!";

// //   if (riskScore > 0.6) {
// //     level = 'HIGH';
// //     message =
// //       '⚠️ Urgent: Multiple weak areas detected. Increase study time now.';
// //   } else if (riskScore > 0.35) {
// //     level = 'MEDIUM';
// //     message = 'Focus on weak topics. You have time to improve.';
// //   }

// //   return { level, message, score: Math.round(riskScore * 100) };
// // };

// // // ===== API ROUTES =====
// // app.post('/user/init', async (req, res) => {
// //   try {
// //     const { name, topics, examDate } = req.body;
// //     const userId = Date.now().toString();
// //     const user = new User({ id: userId, name, topics, examDate });
// //     await user.save();
// //     res.json({ success: true, userId });
// //   } catch (err) {
// //     res.status(500).json({ error: err.message });
// //   }
// // });

// // app.post('/session/add', async (req, res) => {
// //   try {
// //     const { userId, topic, accuracy, timeSpent, questionsAttempted, correct } = req.body;
// //     const session = new Session({ userId, topic, accuracy, timeSpent, questionsAttempted, correct });
// //     await session.save();
// //     res.json({ success: true });
// //   } catch (err) {
// //     res.status(500).json({ error: err.message });
// //   }
// // });

// // app.get('/dashboard/:userId', async (req, res) => {
// //   try {
// //     const { userId } = req.params;
// //     const analysis = await analyzePerformance(userId);
// //     const risk = await assessRisk(userId);

// //     if (!analysis || analysis.topicAnalysis.length === 0) {
// //       return res.json({
// //         accuracy: null,
// //         weakTopics: [],
// //         risk,
// //         totalSessions: 0,
// //         message: 'Start learning to see analytics',
// //       });
// //     }

// //     res.json({
// //       accuracy: Math.round(
// //         (analysis.topicAnalysis.reduce((sum, t) => sum + t.accuracy, 0) /
// //           analysis.topicAnalysis.length) *
// //           100
// //       ),
// //       topicBreakdown: analysis.topicAnalysis,
// //       weakTopics: analysis.topicAnalysis.filter((t) => t.isWeak).map((t) => t.topic),
// //       risk,
// //       totalSessions: analysis.totalSessions,
// //     });
// //   } catch (err) {
// //     res.status(500).json({ error: err.message });
// //   }
// // });

// // app.get('/planner/:userId', async (req, res) => {
// //   try {
// //     const { userId } = req.params;
// //     const plan = await StudyPlan.findOne({ userId }).sort({ generatedAt: -1 });

// //     if (!plan) {
// //       const newPlan = await generateStudyPlan(userId);
// //       return res.json(newPlan);
// //     }

// //     res.json({ dailyPlan: plan.plan, topicPriorities: plan.topicPriorities });
// //   } catch (err) {
// //     res.status(500).json({ error: err.message });
// //   }
// // });

// // // ✅ FIXED TUTOR
// // app.post('/tutor', async (req, res) => {
// //   try {
// //     const { userId, topic, question } = req.body;

// //     if (!topic || !question) {
// //       return res.status(400).json({ error: "Topic and question required" });
// //     }

// //     const analysis = await analyzePerformance(userId);

// //     let weaknessContext = '';
// //     if (analysis && analysis.topicAnalysis.length > 0) {
// //       const t = analysis.topicAnalysis.find((x) => x.topic === topic);
// //       if (t) {
// //         weaknessContext = `Student accuracy: ${Math.round(t.accuracy * 100)}%`;
// //       }
// //     }

// //     const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// //     const prompt = `
// // You are a tutor.

// // Topic: ${topic}
// // ${weaknessContext}

// // Question: ${question}

// // Explain simply with example and tip.
// // `;

// //     const result = await model.generateContent(prompt);

// //     let responseText = "No response generated";

// //     if (result && result.response && typeof result.response.text === 'function') {
// //       responseText = result.response.text();
// //     }

// //     res.json({ success: true, response: responseText, topic });

// //   } catch (err) {
// //     console.error(err);
// //     res.status(500).json({ error: "Tutor failed", details: err.message });
// //   }
// // });

// // app.get('/regenerate-plan/:userId', async (req, res) => {
// //   try {
// //     const { userId } = req.params;
// //     await StudyPlan.deleteMany({ userId });
// //     const newPlan = await generateStudyPlan(userId);
// //     res.json(newPlan);
// //   } catch (err) {
// //     res.status(500).json({ error: err.message });
// //   }
// // });

// // // ===== START SERVER =====
// // const PORT = process.env.PORT || 5000;
// // app.listen(PORT, () => {
// //   console.log(`🚀 Server running on ${PORT}`);
// // });
const express = require('express');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { connectDB, User, Session, StudyPlan } = require('./db');

dotenv.config();
const app = express();

const cors = require('cors');
app.use(cors());
app.use(express.json());

connectDB();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ===== ANALYTICS =====
const analyzePerformance = async (userId) => {
  const sessions = await Session.find({ userId }).sort({ timestamp: -1 }).limit(50);

  if (sessions.length === 0) {
    return { topicAnalysis: [], totalSessions: 0 };
  }

  const byTopic = {};
  sessions.forEach((s) => {
    if (!byTopic[s.topic]) byTopic[s.topic] = [];
    byTopic[s.topic].push(s);
  });

  const topicAnalysis = Object.entries(byTopic).map(([topic, records]) => {
    const accuracy =
      records.reduce((sum, r) => sum + (r.correct / r.questionsAttempted), 0) /
      records.length;

    const trend =
      records.length >= 2
        ? records[0].correct / records[0].questionsAttempted -
          records[1].correct / records[1].questionsAttempted
        : 0;

    const avgTime =
      records.reduce((sum, r) => sum + r.timeSpent, 0) / records.length;

    const isWeak = accuracy < 0.6;

    return { topic, accuracy, trend, avgTime, isWeak };
  });

  return { topicAnalysis, totalSessions: sessions.length };
};

// ===== STUDY PLAN GENERATION (FIXED - NOW DYNAMIC) =====
const generateStudyPlan = async (userId) => {
  const user = await User.findOne({ id: userId });
  const analysis = await analyzePerformance(userId);

  // ✅ AI FALLBACK (NEW USERS - NO SESSION DATA)
  if (!analysis || analysis.topicAnalysis.length === 0) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
Create a 7-day personalized study plan.

Student Name: ${user.name}
Exam Date: ${user.examDate}
Topics: ${user.topics.join(', ')}

Rules:
- Each day should cover DIFFERENT topics progressively
- Day 1-2: Fundamentals
- Day 3-4: Intermediate concepts
- Day 5-6: Advanced + Practice
- Day 7: Review + Mock test
- Beginner friendly pace

Return ONLY valid JSON (no markdown, no backticks):
[
  {
    "day": 1,
    "topics": [
      { "topic": "Topic Name", "hours": 2, "focus": ["concept", "basics"] }
    ]
  }
]
`;

      const result = await model.generateContent(prompt);

      let text = result.response.text();
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();

      let aiPlan;
      try {
        aiPlan = JSON.parse(text);
      } catch {
        aiPlan = [];
      }

      return {
        dailyPlan: aiPlan,
        topicPriorities: [],
        aiGenerated: true,
        message: "AI-generated plan (no session data)",
      };
    } catch (err) {
      console.error("AI Plan Error:", err.message);
      return {
        dailyPlan: [],
        topicPriorities: [],
        aiGenerated: true,
        message: "Failed to generate AI plan",
      };
    }
  }

  // ✅ EXISTING USERS - DYNAMIC PLAN BASED ON WEAK TOPICS
  const daysUntilExam = Math.ceil(
    (new Date(user.examDate) - new Date()) / (1000 * 60 * 60 * 24)
  );

  const deadlineWeight = Math.min(1, (60 - daysUntilExam) / 60);

  // ✅ PRIORITY SCORING - IDENTIFIES WEAK TOPICS
  const priorityTopics = analysis.topicAnalysis
    .map((t) => ({
      ...t,
      priorityScore:
        (1 - t.accuracy) * 0.4 +
        deadlineWeight * 0.3 +
        Math.max(0, -t.trend) * 0.3,
    }))
    .sort((a, b) => b.priorityScore - a.priorityScore);

  // ✅ DAILY PLAN - NOW DISTRIBUTES TOPICS DYNAMICALLY
  const dailyPlan = [];

  // Get top 3 weak topics
  const topWeakTopics = priorityTopics.slice(0, Math.min(3, priorityTopics.length));

  // Get remaining topics for variety
  const otherTopics = priorityTopics.slice(Math.min(3, priorityTopics.length));

  for (let day = 1; day <= 7; day++) {
    let todayTopics = [];

    // ✅ DYNAMIC DISTRIBUTION:
    // Day 1-2: Focus on weakest topic (most practice)
    // Day 3-4: Mix of weak + medium
    // Day 5-7: Review + advanced

    if (day <= 2) {
      // Days 1-2: Intensive on weakest topic
      todayTopics = [topWeakTopics[0]].map((t) => ({
        topic: t.topic,
        minTime: Math.max(90, Math.ceil(t.avgTime / 60) * 2), // 90+ mins
        focusAreas: ['fundamentals', 'practice', 'examples'],
      }));
    } else if (day <= 4) {
      // Days 3-4: Mix weak topics
      const topicsForDay = [topWeakTopics[0], topWeakTopics[1]].filter(Boolean);
      todayTopics = topicsForDay.map((t, idx) => ({
        topic: t.topic,
        minTime: Math.max(60, Math.ceil(t.avgTime / 60) * (1.5 - idx * 0.3)),
        focusAreas: idx === 0 ? ['fundamentals', 'practice'] : ['intermediate', 'practice'],
      }));
    } else if (day <= 6) {
      // Days 5-6: All weak topics + start review
      const topicsForDay = topWeakTopics.slice(0, 2).filter(Boolean);
      todayTopics = topicsForDay.map((t) => ({
        topic: t.topic,
        minTime: 45,
        focusAreas: ['advanced', 'practice', 'optimization'],
      }));

      // Add a different topic for variety
      if (otherTopics.length > 0 && day === 6) {
        todayTopics.push({
          topic: otherTopics[0].topic,
          minTime: 45,
          focusAreas: ['review', 'consolidation'],
        });
      }
    } else {
      // Day 7: Full review
      todayTopics = priorityTopics.slice(0, 2).map((t) => ({
        topic: t.topic,
        minTime: 60,
        focusAreas: ['mock-test', 'review', 'final-practice'],
      }));
    }

    dailyPlan.push({
      day,
      date: new Date(Date.now() + day * 86400000)
        .toISOString()
        .split('T')[0],
      topics: todayTopics,
      completed: false,
    });
  }

  const plan = new StudyPlan({
    userId,
    plan: dailyPlan,
    topicPriorities: priorityTopics,
  });

  await plan.save();

  return {
    dailyPlan,
    topicPriorities: priorityTopics,
    daysUntilExam,
  };
};

// ===== RISK ASSESSMENT =====
const assessRisk = async (userId) => {
  const analysis = await analyzePerformance(userId);

  if (!analysis || analysis.topicAnalysis.length === 0) {
    return { level: 'MEDIUM', message: 'Insufficient data', score: 0 };
  }

  const avgAccuracy =
    analysis.topicAnalysis.reduce((sum, t) => sum + t.accuracy, 0) /
    analysis.topicAnalysis.length;

  const weakTopics = analysis.topicAnalysis.filter((t) => t.isWeak).length;

  const negativesTrending = analysis.topicAnalysis.filter(
    (t) => t.trend < -0.1
  ).length;

  const riskScore =
    avgAccuracy * 0.5 +
    (weakTopics / analysis.topicAnalysis.length) * 0.3 +
    (negativesTrending / analysis.topicAnalysis.length) * 0.2;

  let level = 'LOW';
  let message = "You're on track!";

  if (riskScore > 0.6) {
    level = 'HIGH';
    message =
      '⚠️ Urgent: Multiple weak areas detected. Increase study time now.';
  } else if (riskScore > 0.35) {
    level = 'MEDIUM';
    message = 'Focus on weak topics. You have time to improve.';
  }

  return { level, message, score: Math.round(riskScore * 100) };
};

// ===== API ROUTES =====
app.post('/user/init', async (req, res) => {
  try {
    const { name, topics, examDate } = req.body;
    const userId = Date.now().toString();
    const user = new User({ id: userId, name, topics, examDate });
    await user.save();
    res.json({ success: true, userId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/session/add', async (req, res) => {
  try {
    const { userId, topic, accuracy, timeSpent, questionsAttempted, correct } = req.body;
    const session = new Session({ userId, topic, accuracy, timeSpent, questionsAttempted, correct });
    await session.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/dashboard/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const analysis = await analyzePerformance(userId);
    const risk = await assessRisk(userId);

    if (!analysis || analysis.topicAnalysis.length === 0) {
      return res.json({
        accuracy: null,
        weakTopics: [],
        risk,
        totalSessions: 0,
        message: 'Start learning to see analytics',
      });
    }

    res.json({
      accuracy: Math.round(
        (analysis.topicAnalysis.reduce((sum, t) => sum + t.accuracy, 0) /
          analysis.topicAnalysis.length) *
          100
      ),
      topicBreakdown: analysis.topicAnalysis,
      weakTopics: analysis.topicAnalysis.filter((t) => t.isWeak).map((t) => t.topic),
      risk,
      totalSessions: analysis.totalSessions,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/planner/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const plan = await StudyPlan.findOne({ userId }).sort({ generatedAt: -1 });

    if (!plan) {
      const newPlan = await generateStudyPlan(userId);
      return res.json(newPlan);
    }

    res.json({ dailyPlan: plan.plan, topicPriorities: plan.topicPriorities });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ FIXED TUTOR - NOW WORKS WITH PROPER ERROR HANDLING
app.post('/tutor', async (req, res) => {
  try {
    const { userId, topic, question } = req.body;

    // Validate inputs
    if (!topic || !question) {
      return res.status(400).json({ error: "Topic and question required" });
    }

    const analysis = await analyzePerformance(userId);

    // Build context from student performance
    let weaknessContext = '';
    if (analysis && analysis.topicAnalysis.length > 0) {
      const topicData = analysis.topicAnalysis.find((x) => x.topic === topic);
      if (topicData) {
        weaknessContext = `Student's current accuracy in ${topic}: ${Math.round(topicData.accuracy * 100)}%\n`;
        if (topicData.isWeak) {
          weaknessContext += `This is a weak area for the student.\n`;
        }
      }
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are an expert tutor helping a student understand ${topic}.

${weaknessContext}

Student's Question: "${question}"

Provide a helpful response with:
1. A clear, simple explanation
2. A concrete real-world example
3. One practical tip to remember

Keep it concise (under 200 words). Use a friendly, encouraging tone.`;

    console.log('🔄 Sending to Gemini API...');
    
    const result = await model.generateContent(prompt);

    if (!result || !result.response) {
      return res.status(500).json({ 
        error: "No response from AI",
        details: "result object is empty"
      });
    }

    const responseText = result.response.text();

    if (!responseText) {
      return res.status(500).json({ 
        error: "Empty response from AI",
        details: "text() returned empty string"
      });
    }

    console.log('✅ Response received from Gemini');

    res.json({ 
      success: true, 
      response: responseText, 
      topic 
    });

  } catch (err) {
    console.error('❌ Tutor Error:', err);
    res.status(500).json({ 
      error: "Tutor service failed", 
      details: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/regenerate-plan/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    await StudyPlan.deleteMany({ userId });
    const newPlan = await generateStudyPlan(userId);
    res.json(newPlan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});
// const express = require('express');
// const dotenv = require('dotenv');
// const { connectDB, User, Session, StudyPlan } = require('./db');

// dotenv.config();
// const app = express();

// const cors = require('cors');
// app.use(cors());
// app.use(express.json());

// connectDB();

// // ===== ANALYTICS =====
// const analyzePerformance = async (userId) => {
//   const sessions = await Session.find({ userId }).sort({ timestamp: -1 }).limit(50);

//   if (sessions.length === 0) {
//     return { topicAnalysis: [], totalSessions: 0 };
//   }

//   const byTopic = {};
//   sessions.forEach((s) => {
//     if (!byTopic[s.topic]) byTopic[s.topic] = [];
//     byTopic[s.topic].push(s);
//   });

//   const topicAnalysis = Object.entries(byTopic).map(([topic, records]) => {
//     const accuracy =
//       records.reduce((sum, r) => sum + (r.correct / r.questionsAttempted), 0) /
//       records.length;

//     const trend =
//       records.length >= 2
//         ? records[0].correct / records[0].questionsAttempted -
//           records[1].correct / records[1].questionsAttempted
//         : 0;

//     const avgTime =
//       records.reduce((sum, r) => sum + r.timeSpent, 0) / records.length;

//     const isWeak = accuracy < 0.6;

//     return { topic, accuracy, trend, avgTime, isWeak };
//   });

//   return { topicAnalysis, totalSessions: sessions.length };
// };

// // ===== STUDY PLAN GENERATION (USING HUGGINGFACE) =====
// const generateStudyPlan = async (userId) => {
//   const user = await User.findOne({ id: userId });
//   const analysis = await analyzePerformance(userId);

//   // ✅ AI FALLBACK (NEW USERS - NO SESSION DATA)
//   if (!analysis || analysis.topicAnalysis.length === 0) {
//     try {
//       console.log('🔄 Generating study plan with Hugging Face...');

//       const prompt = `Create a 7-day personalized study plan in JSON format.

// Student Name: ${user.name}
// Exam Date: ${user.examDate}
// Topics: ${user.topics.join(', ')}

// Return ONLY this JSON structure (no markdown, no backticks):
// [
//   {
//     "day": 1,
//     "topics": [
//       { "topic": "First Topic", "hours": 2, "focus": ["concept", "basics"] }
//     ]
//   },
//   {
//     "day": 2,
//     "topics": [
//       { "topic": "First Topic", "hours": 2, "focus": ["practice", "examples"] }
//     ]
//   }
// ]`;

//       const response = await fetch(
//         'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1',
//         {
//           headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` },
//           method: 'POST',
//           body: JSON.stringify({ inputs: prompt, parameters: { max_length: 2000 } }),
//         }
//       );

//       if (!response.ok) {
//         throw new Error(`HF API error: ${response.status}`);
//       }

//       const result = await response.json();
//       let text = result[0].generated_text;

//       // Extract JSON from response
//       const jsonMatch = text.match(/\[[\s\S]*\]/);
//       let aiPlan = [];

//       if (jsonMatch) {
//         try {
//           aiPlan = JSON.parse(jsonMatch[0]);
//         } catch {
//           console.error('Failed to parse plan JSON');
//         }
//       }

//       console.log('✅ Study plan generated successfully');

//       return {
//         dailyPlan: aiPlan.length > 0 ? aiPlan : generateFallbackPlan(user),
//         topicPriorities: [],
//         aiGenerated: true,
//         message: 'AI-generated plan (no session data)',
//       };
//     } catch (err) {
//       console.error('❌ AI Plan Error:', err.message);
//       return {
//         dailyPlan: generateFallbackPlan(user),
//         topicPriorities: [],
//         aiGenerated: false,
//         message: 'Using default plan',
//       };
//     }
//   }

//   // ✅ EXISTING USERS - DYNAMIC PLAN BASED ON WEAK TOPICS
//   const daysUntilExam = Math.ceil(
//     (new Date(user.examDate) - new Date()) / (1000 * 60 * 60 * 24)
//   );

//   const deadlineWeight = Math.min(1, (60 - daysUntilExam) / 60);

//   const priorityTopics = analysis.topicAnalysis
//     .map((t) => ({
//       ...t,
//       priorityScore:
//         (1 - t.accuracy) * 0.4 +
//         deadlineWeight * 0.3 +
//         Math.max(0, -t.trend) * 0.3,
//     }))
//     .sort((a, b) => b.priorityScore - a.priorityScore);

//   const dailyPlan = [];
//   const topWeakTopics = priorityTopics.slice(0, Math.min(3, priorityTopics.length));
//   const otherTopics = priorityTopics.slice(Math.min(3, priorityTopics.length));

//   for (let day = 1; day <= 7; day++) {
//     let todayTopics = [];

//     if (day <= 2) {
//       todayTopics = [topWeakTopics[0]].map((t) => ({
//         topic: t.topic,
//         minTime: Math.max(90, Math.ceil(t.avgTime / 60) * 2),
//         focusAreas: ['fundamentals', 'practice', 'examples'],
//       }));
//     } else if (day <= 4) {
//       const topicsForDay = [topWeakTopics[0], topWeakTopics[1]].filter(Boolean);
//       todayTopics = topicsForDay.map((t, idx) => ({
//         topic: t.topic,
//         minTime: Math.max(60, Math.ceil(t.avgTime / 60) * (1.5 - idx * 0.3)),
//         focusAreas: idx === 0 ? ['fundamentals', 'practice'] : ['intermediate', 'practice'],
//       }));
//     } else if (day <= 6) {
//       const topicsForDay = topWeakTopics.slice(0, 2).filter(Boolean);
//       todayTopics = topicsForDay.map((t) => ({
//         topic: t.topic,
//         minTime: 45,
//         focusAreas: ['advanced', 'practice', 'optimization'],
//       }));

//       if (otherTopics.length > 0 && day === 6) {
//         todayTopics.push({
//           topic: otherTopics[0].topic,
//           minTime: 45,
//           focusAreas: ['review', 'consolidation'],
//         });
//       }
//     } else {
//       todayTopics = priorityTopics.slice(0, 2).map((t) => ({
//         topic: t.topic,
//         minTime: 60,
//         focusAreas: ['mock-test', 'review', 'final-practice'],
//       }));
//     }

//     dailyPlan.push({
//       day,
//       date: new Date(Date.now() + day * 86400000)
//         .toISOString()
//         .split('T')[0],
//       topics: todayTopics,
//       completed: false,
//     });
//   }

//   const plan = new StudyPlan({
//     userId,
//     plan: dailyPlan,
//     topicPriorities: priorityTopics,
//   });

//   await plan.save();

//   return {
//     dailyPlan,
//     topicPriorities: priorityTopics,
//     daysUntilExam,
//   };
// };

// // ===== FALLBACK PLAN GENERATOR =====
// const generateFallbackPlan = (user) => {
//   const topics = user.topics;
//   const dailyPlan = [];

//   for (let day = 1; day <= 7; day++) {
//     const topicIndex = (day - 1) % topics.length;
//     dailyPlan.push({
//       day,
//       date: new Date(Date.now() + day * 86400000).toISOString().split('T')[0],
//       topics: [
//         {
//           topic: topics[topicIndex],
//           minTime: 90 - (day - 1) * 5,
//           focusAreas: day <= 2 ? ['basics'] : day <= 5 ? ['practice'] : ['review'],
//         },
//       ],
//       completed: false,
//     });
//   }

//   return dailyPlan;
// };

// // ===== RISK ASSESSMENT =====
// const assessRisk = async (userId) => {
//   const analysis = await analyzePerformance(userId);

//   if (!analysis || analysis.topicAnalysis.length === 0) {
//     return { level: 'MEDIUM', message: 'Insufficient data', score: 0 };
//   }

//   const avgAccuracy =
//     analysis.topicAnalysis.reduce((sum, t) => sum + t.accuracy, 0) /
//     analysis.topicAnalysis.length;

//   const weakTopics = analysis.topicAnalysis.filter((t) => t.isWeak).length;

//   const negativesTrending = analysis.topicAnalysis.filter(
//     (t) => t.trend < -0.1
//   ).length;

//   const riskScore =
//     avgAccuracy * 0.5 +
//     (weakTopics / analysis.topicAnalysis.length) * 0.3 +
//     (negativesTrending / analysis.topicAnalysis.length) * 0.2;

//   let level = 'LOW';
//   let message = "You're on track!";

//   if (riskScore > 0.6) {
//     level = 'HIGH';
//     message =
//       '⚠️ Urgent: Multiple weak areas detected. Increase study time now.';
//   } else if (riskScore > 0.35) {
//     level = 'MEDIUM';
//     message = 'Focus on weak topics. You have time to improve.';
//   }

//   return { level, message, score: Math.round(riskScore * 100) };
// };

// // ===== API ROUTES =====
// app.post('/user/init', async (req, res) => {
//   try {
//     const { name, topics, examDate } = req.body;
//     const userId = Date.now().toString();
//     const user = new User({ id: userId, name, topics, examDate });
//     await user.save();
//     res.json({ success: true, userId });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// app.post('/session/add', async (req, res) => {
//   try {
//     const { userId, topic, accuracy, timeSpent, questionsAttempted, correct } = req.body;
//     const session = new Session({ userId, topic, accuracy, timeSpent, questionsAttempted, correct });
//     await session.save();
//     res.json({ success: true });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// app.get('/dashboard/:userId', async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const analysis = await analyzePerformance(userId);
//     const risk = await assessRisk(userId);

//     if (!analysis || analysis.topicAnalysis.length === 0) {
//       return res.json({
//         accuracy: null,
//         weakTopics: [],
//         risk,
//         totalSessions: 0,
//         message: 'Start learning to see analytics',
//       });
//     }

//     res.json({
//       accuracy: Math.round(
//         (analysis.topicAnalysis.reduce((sum, t) => sum + t.accuracy, 0) /
//           analysis.topicAnalysis.length) *
//           100
//       ),
//       topicBreakdown: analysis.topicAnalysis,
//       weakTopics: analysis.topicAnalysis.filter((t) => t.isWeak).map((t) => t.topic),
//       risk,
//       totalSessions: analysis.totalSessions,
//     });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// app.get('/planner/:userId', async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const plan = await StudyPlan.findOne({ userId }).sort({ generatedAt: -1 });

//     if (!plan) {
//       const newPlan = await generateStudyPlan(userId);
//       return res.json(newPlan);
//     }

//     res.json({ dailyPlan: plan.plan, topicPriorities: plan.topicPriorities });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // ✅ TUTOR ENDPOINT WITH HUGGINGFACE
// app.post('/tutor', async (req, res) => {
//   try {
//     const { userId, topic, question } = req.body;

//     if (!topic || !question) {
//       return res.status(400).json({ error: 'Topic and question required' });
//     }

//     const analysis = await analyzePerformance(userId);

//     let weaknessContext = '';
//     if (analysis && analysis.topicAnalysis.length > 0) {
//       const topicData = analysis.topicAnalysis.find((x) => x.topic === topic);
//       if (topicData) {
//         weaknessContext = `\nStudent's current accuracy in ${topic}: ${Math.round(topicData.accuracy * 100)}%`;
//         if (topicData.isWeak) {
//           weaknessContext += '\nThis is a weak area for the student.';
//         }
//       }
//     }

//     console.log('🔄 Sending question to Hugging Face...');

//     const prompt = `You are an expert tutor helping a student understand ${topic}.
// ${weaknessContext}

// Student's Question: "${question}"

// Provide a helpful response with:
// 1. A clear, simple explanation (2-3 sentences)
// 2. A concrete real-world example
// 3. One practical tip to remember

// Keep response under 150 words. Be friendly and encouraging.`;

//     const response = await fetch(
//       'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1',
//       {
//         headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` },
//         method: 'POST',
//         body: JSON.stringify({ inputs: prompt, parameters: { max_length: 500 } }),
//       }
//     );

//     if (!response.ok) {
//       throw new Error(`HF API error: ${response.status}`);
//     }

//     const result = await response.json();
//     const responseText = result[0].generated_text.split(prompt)[1]?.trim() || result[0].generated_text;

//     if (!responseText) {
//       return res.status(500).json({
//         error: 'Empty response from AI',
//         details: 'No content generated',
//       });
//     }

//     console.log('✅ Response received from Hugging Face');

//     res.json({
//       success: true,
//       response: responseText,
//       topic,
//       model: 'Mistral-7B',
//     });
//   } catch (err) {
//     console.error('❌ Tutor Error:', err);
//     res.status(500).json({
//       error: 'Tutor service failed',
//       details: err.message,
//       timestamp: new Date().toISOString(),
//     });
//   }
// });

// app.get('/regenerate-plan/:userId', async (req, res) => {
//   try {
//     const { userId } = req.params;
//     await StudyPlan.deleteMany({ userId });
//     const newPlan = await generateStudyPlan(userId);
//     res.json(newPlan);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// // ===== START SERVER =====
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on ${PORT}`);
//   console.log(`✅ Using Hugging Face Mistral-7B (FREE API)`);
// });