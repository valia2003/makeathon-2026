const axios = require('axios');

const API_URL = 'http://localhost:8000';

const queries = [
  {
    name: 'A: Quiet mountain river',
    message: 'I want a quiet mountain trail with rivers and low crowds'
  },
  {
    name: 'B: Menalon Trail',
    message: 'Tell me about Menalon Trail'
  },
  {
    name: 'C: Weather in Zagori',
    message: 'What is the weather in Zagori?'
  },
  {
    name: 'D: Nearby exploration',
    message: 'What else is nearby?',
    dependsOn: 0 // Depends on query A for memory
  },
  {
    name: 'E: Guardrail (Joke)',
    message: 'Tell me a joke'
  }
];

async function runTests() {
  const conversationId = 'test-conv-' + Date.now();
  const memories = {};

  for (let i = 0; i < queries.length; i++) {
    const q = queries[i];
    console.log(`\n--- Testing ${q.name} ---`);
    console.log(`Query: "${q.message}"`);
    
    try {
      const response = await axios.post(`${API_URL}/api/chat`, {
        message: q.message,
        conversationId
      });
      
      console.log(`Mode: ${response.data.mode}`);
      console.log(`Message: ${response.data.message.substring(0, 100)}...`);
      if (response.data.selectedTrail) {
          console.log(`Selected Trail: ${response.data.selectedTrail.name}`);
      }
      if (response.data.recommendedDestination) {
          console.log(`Recommended Destination: ${response.data.recommendedDestination.name}`);
      }
    } catch (error) {
      console.error(`Error: ${error.message}`);
      if (error.response) {
          console.error(`Response: ${JSON.stringify(error.response.data)}`);
      }
    }
  }
}

runTests();
