const axios = require('axios');

// SOLID — Single Responsibility
// ONLY job: categorize transaction description using AI

class AICategorizor {

constructor() {
  this.apiUrl = 'https://router.huggingface.co/hf-inference/models/facebook/bart-large-mnli';
  this.labels = [
    'Food & Dining',
    'Transport',
    'Shopping',
    'Bills & Utilities',
    'Entertainment',
    'Health',
    'Education',
    'Travel',
    'Salary',
    'Freelance',
    'Investment',
    'Other'
  ];
}
async categorize(description) {
  const token = process.env.HF_TOKEN;
  try {
    if (!token || token === 'your_huggingface_token_here') {
      return this.ruleBasedCategory(description);
    }

    const response = await axios.post(
      this.apiUrl,
      {
        inputs: description,
        parameters: { candidate_labels: this.labels }
      },
      {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000
      }
    );

    if (!response.data?.labels) {
      return this.ruleBasedCategory(description);
    }

    return {
      category: response.data.labels[0],
      confidence: response.data.scores[0]
    };

  } catch (error) {
    console.log('AI failed, using rule-based:', error.message);
    return this.ruleBasedCategory(description);
  }
}

  // Rule-based fallback — works without any API key
  ruleBasedCategory(description) {
    const desc = description.toUpperCase();

    const rules = [
      { keywords: ['ZOMATO', 'SWIGGY', 'RESTAURANT', 'FOOD', 'CAFE', 'PIZZA', 'BURGER', 'HOTEL'], category: 'Food & Dining' },
      { keywords: ['UBER', 'OLA', 'RAPIDO', 'METRO', 'PETROL', 'FUEL', 'PARKING', 'AUTO'], category: 'Transport' },
      { keywords: ['AMAZON', 'FLIPKART', 'MYNTRA', 'SHOPPING', 'MALL', 'STORE', 'MARKET'], category: 'Shopping' },
      { keywords: ['ELECTRICITY', 'WATER', 'GAS', 'INTERNET', 'BROADBAND', 'MOBILE', 'RECHARGE', 'BILL'], category: 'Bills & Utilities' },
      { keywords: ['NETFLIX', 'HOTSTAR', 'SPOTIFY', 'MOVIE', 'CINEMA', 'GAME', 'YOUTUBE'], category: 'Entertainment' },
      { keywords: ['HOSPITAL', 'PHARMACY', 'DOCTOR', 'MEDICAL', 'CLINIC', 'HEALTH', 'MEDICINE'], category: 'Health' },
      { keywords: ['COLLEGE', 'UNIVERSITY', 'SCHOOL', 'COURSE', 'UDEMY', 'FEES', 'TUITION'], category: 'Education' },
      { keywords: ['FLIGHT', 'HOTEL', 'MAKEMYTRIP', 'GOIBIBO', 'TRAVEL', 'TRIP', 'BOOKING'], category: 'Travel' },
      { keywords: ['SALARY', 'STIPEND', 'PAYROLL', 'WAGES'], category: 'Salary' },
      { keywords: ['FREELANCE', 'CLIENT', 'PROJECT', 'PAYMENT RECEIVED'], category: 'Freelance' },
      { keywords: ['MUTUAL FUND', 'STOCKS', 'ZERODHA', 'GROWW', 'DIVIDEND', 'INTEREST'], category: 'Investment' }
    ];

    for (const rule of rules) {
      if (rule.keywords.some(keyword => desc.includes(keyword))) {
        return { category: rule.category, confidence: 0.85 };
      }
    }

    return { category: 'Other', confidence: 0.5 };
  }
}

module.exports = new AICategorizor();