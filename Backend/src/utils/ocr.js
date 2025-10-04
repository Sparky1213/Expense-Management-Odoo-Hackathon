const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Groq } = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Parse receipt using Gemini Vision and Groq
const parseReceipt = async (imageBuffer) => {
  try {
    // Step 1: Extract text using Gemini Vision
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
    
    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64');
    const mimeType = 'image/jpeg'; // Adjust based on actual image type if needed

    const prompt = "Extract all text from this receipt image. Focus on merchant name, total amount, currency, date, and individual items if present.";
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType
        }
      }
    ]);

    const text = result.response.text();
    
    if (!text || text.trim().length === 0) {
      throw new Error('No text found in the image');
    }

    // Step 2: Use Groq to parse the extracted text
    const parsePrompt = `
    Parse the following receipt text and extract structured information. Return a JSON object with the following fields:
    - merchant: The name of the business/merchant
    - amount: The total amount (number only, no currency symbol)
    - currency: The currency code (3 letters like USD, EUR, INR)
    - date: The date in YYYY-MM-DD format
    - category: One of these categories: Food, Transport, Accommodation, Entertainment, Office Supplies, Travel, Other
    - items: Array of individual items with name and price (if available)
    
    If any information is not available, use null for that field.
    
    Receipt text:
    ${text}
    
    Return only valid JSON, no other text.
    `;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert at parsing receipt text and extracting structured data. Always return valid JSON format."
        },
        {
          role: "user",
          content: parsePrompt
        }
      ],
      model: "llama3-8b-8192",
      temperature: 0.1,
      max_tokens: 1000
    });

    const aiResponse = completion.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('AI parsing failed');
    }

    // Parse the AI response as JSON
    let parsedData;
    try {
      const cleanedResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('AI Response:', aiResponse);
      
      parsedData = {
        merchant: null,
        amount: null,
        currency: null,
        date: null,
        category: 'Other',
        items: [],
        rawText: text,
        error: 'Failed to parse AI response'
      };
    }

    return {
      success: true,
      data: parsedData,
      rawText: text
    };

  } catch (error) {
    console.error('OCR parsing error:', error);
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

// Extract text only using Gemini Vision
const extractText = async (imageBuffer) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
    
    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64');
    const mimeType = 'image/jpeg';

    const prompt = "Extract and return all visible text from this image.";
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType
        }
      }
    ]);

    const text = result.response.text();

    return {
      success: true,
      text: text || ''
    };
  } catch (error) {
    console.error('Text extraction error:', error);
    return {
      success: false,
      error: error.message,
      text: ''
    };
  }
};

module.exports = {
  parseReceipt,
  extractText
};
