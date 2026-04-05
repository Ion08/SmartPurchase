import { GoogleGenerativeAI, GenerativeModel, Part } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Expected output schema from Gemini
export interface ExtractedFiscalData {
  date: string; // YYYY-MM-DD
  time_block: string; // Extracted from the dataset as mentioned (e.g., 'Morning', 'Breakfast', 'Shift 1', etc.)
  total_revenue: number;
  transactions: number;
  items: Array<{
    name: string;
    category: string;
    quantity: number;
    price_per_unit: number;
  }>;
}

const EXTRACTION_PROMPT = `You are a high-precision fiscal data extractor specialized in restaurant and hospitality POS reports.

Task: Extract itemized sales data from the provided fiscal document (PDF, image, text, CSV, or Excel).

Instructions:
1. Identify the date of the report (format as YYYY-MM-DD)
2. Extract the time block EXACTLY as mentioned in the dataset (e.g., if the report says "Breakfast Shift", use "Breakfast Shift"; if it says "Morning", use "Morning"; if it has timestamps like "08:00-12:00", extract the label associated with those timestamps)
3. Extract total revenue (sum of all sales)
4. Count total number of transactions
5. Extract EACH AND EVERY item sold with: name, category, quantity, and price per unit - analyze ALL rows, do not skip any items

Important:
- For CSV/Excel files: Process EVERY single row in the dataset, ensuring no items are missed
- Use the time block name EXACTLY as it appears in the source document - do not normalize it to generic terms unless the document already uses generic terms
- If the report has a column or field labeled "Shift", "Time Block", "Period", or similar, use that value directly
- If the report contains timestamps without explicit labels, infer a descriptive label (e.g., "08:00-12:00" → "Morning (08:00-12:00)")
- Categories should be general: Food, Beverage, Alcohol, Merchandise, or infer from item names
- Prices should be per unit (divide total line amount by quantity if needed)
- Return ONLY a valid JSON object in this exact format:

{
  "date": "YYYY-MM-DD",
  "time_block": "Extract the time block as mentioned in the dataset",
  "total_revenue": 0.00,
  "transactions": 0,
  "items": [
    {"name": "Item Name", "category": "Category", "quantity": 5, "price_per_unit": 0.00}
  ]
}

If you cannot determine a value, use reasonable defaults (date: today's date, time_block: "Unspecified", numeric values: 0). Never return null for required fields.`;

function fileToGenerativePart(fileBuffer: Buffer, mimeType: string): Part {
  return {
    inlineData: {
      data: fileBuffer.toString('base64'),
      mimeType,
    },
  };
}

function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return 'application/pdf';
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'txt':
    case 'text':
      return 'text/plain';
    case 'csv':
      return 'text/csv';
    case 'xlsx':
    case 'xls':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    default:
      return 'application/octet-stream';
  }
}

function isVisualFile(mimeType: string): boolean {
  return mimeType.startsWith('image/') || mimeType === 'application/pdf';
}

function isStructuredDataFile(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext === 'csv' || ext === 'xlsx' || ext === 'xls';
}

export async function extractFiscalData(
  fileBuffer: Buffer,
  filename: string
): Promise<ExtractedFiscalData> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  const model: GenerativeModel = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 10000,
    },
  });

  const mimeType = getMimeType(filename);
  const isVisual = isVisualFile(mimeType);
  const isStructured = isStructuredDataFile(filename);

  let result;
  
  if (isVisual) {
    // For PDFs and images, use the file as a part
    const filePart = fileToGenerativePart(fileBuffer, mimeType);
    result = await model.generateContent([EXTRACTION_PROMPT, filePart]);
  } else {
    // For text files, include the content directly
    const textContent = fileBuffer.toString('utf-8');
    result = await model.generateContent([
      EXTRACTION_PROMPT,
      `Document content:\n${textContent}`,
    ]);
  }

  const responseText = result.response.text();
  
  // Extract JSON from the response (handle cases where Gemini wraps it in markdown)
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to extract JSON from Gemini response');
  }

  const jsonText = jsonMatch[0];
  
  try {
    const parsed = JSON.parse(jsonText) as ExtractedFiscalData;
    
    // Validate required fields
    if (!parsed.date || !parsed.time_block || typeof parsed.total_revenue !== 'number') {
      throw new Error('Missing required fields in extracted data');
    }

    // Ensure items array exists
    if (!Array.isArray(parsed.items)) {
      parsed.items = [];
    }

    return parsed;
  } catch (error) {
    console.error('Failed to parse Gemini response:', jsonText);
    throw new Error(`Invalid JSON format from Gemini: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
