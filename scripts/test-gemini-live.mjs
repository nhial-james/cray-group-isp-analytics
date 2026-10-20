// Live verification of Gemini Flash AI integration with IPT-G dataset analysis
import { DEFAULT_GEMINI_API_KEY, callGemini, analyzeDatasetWithGemini, answerDatasetQuestionWithGemini } from '../src/app/services/gemini.ts';

async function main() {
  console.log('Testing Live Gemini Flash Connection...');
  const test1 = await callGemini('Hello, confirm you are connected for IPT-G Insights analysis in 5 words.');
  console.log('Gemini Direct Response:', test1);
  if (!test1.success) {
    throw new Error('Gemini API failed: ' + test1.error);
  }

  console.log('\nTesting Dataset AI Analysis with Gemini...');
  const sampleRows = [
    { participant_id: 'P01', baseline_phq9: 16, week4_phq9: 10, week8_phq9: 4, attendance_rate: '88%', session_missed: 1 },
    { participant_id: 'P02', baseline_phq9: 19, week4_phq9: 12, week8_phq9: 5, attendance_rate: '100%', session_missed: 0 },
    { participant_id: 'P03', baseline_phq9: 14, week4_phq9: 8, week8_phq9: 3, attendance_rate: '75%', session_missed: 2 },
  ];
  const headers = ['participant_id', 'baseline_phq9', 'week4_phq9', 'week8_phq9', 'attendance_rate', 'session_missed'];

  const analysis = await analyzeDatasetWithGemini(
    'Cohort_Q3_Clinical_Outcomes.xlsx',
    headers,
    sampleRows,
    {
      recordCount: 3,
      meanScore: 16.3,
      scoreReductionRate: '75% reduction',
      attendanceAverage: '88%',
      missingCount: 0
    },
    DEFAULT_GEMINI_API_KEY
  );

  console.log('Live Gemini Analysis Result:', JSON.stringify(analysis, null, 2));

  console.log('\nTesting Interactive Q&A with Gemini...');
  const answer = await answerDatasetQuestionWithGemini(
    'What was the average symptom score reduction in this cohort?',
    'Cohort_Q3_Clinical_Outcomes.xlsx',
    headers,
    sampleRows,
    {
      recordCount: 3,
      meanScore: 16.3,
      scoreReductionRate: '75% reduction',
      attendanceAverage: '88%'
    },
    DEFAULT_GEMINI_API_KEY
  );

  console.log('Gemini Q&A Answer:', answer);

  console.log('\n=======================================');
  console.log('ALL GEMINI LIVE API TESTS PASSED!');
  console.log('=======================================');
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
