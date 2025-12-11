
import { GoogleGenAI } from "@google/genai";

export interface StockPriceResult {
    price: number;
    sourceUrl?: string;
    sourceTitle?: string;
}

export const fetchStockPrice = async (ticker: string): Promise<StockPriceResult> => {
    if (!ticker || ticker.trim() === '') {
        throw new Error('Ticker symbol cannot be empty.');
    }

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error("API Key not configured. Please set VITE_GEMINI_API_KEY.");
    }

    const ai = new GoogleGenAI({ apiKey });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `What is the current stock price of ${ticker} in USD? 
                       Use Google Search to find the latest market data. 
                       Return ONLY the numeric price value (e.g., 150.25). 
                       Do not include currency symbols ('$') or text explanations.`,
            config: {
                tools: [{ googleSearch: {} }],
            }
        });

        const text = response.text;

        if (!text) {
            throw new Error("No data returned from the service.");
        }

        // Sanitize input to extract the first floating point number found
        const match = text.match(/[\d,]+\.\d{2,}/);
        // Fallback if simple match fails, try to parse the whole string after removing non-numeric/dot chars
        const cleanText = match ? match[0] : text.replace(/[^0-9.]/g, '');

        // Handle comma used as thousands separator
        const normalizedPrice = cleanText.replace(/,/g, '');
        const price = parseFloat(normalizedPrice);

        if (isNaN(price)) {
            throw new Error(`Could not parse a valid price from: "${text}"`);
        }

        // Extract Grounding Metadata
        let sourceUrl: string | undefined;
        let sourceTitle: string | undefined;

        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks && chunks.length > 0) {
            // Prioritize the first web source found
            const webChunk = chunks.find(c => c.web);
            if (webChunk && webChunk.web) {
                sourceUrl = webChunk.web.uri;
                sourceTitle = webChunk.web.title;
            }
        }

        return {
            price,
            sourceUrl,
            sourceTitle
        };

    } catch (error: any) {
        console.error("Stock Fetch Error:", error);
        // Pass through the error message or a generic one
        throw new Error(error.message || "Failed to fetch stock price.");
    }
};