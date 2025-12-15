import { ModelConfig } from '../types';

export const extractJson = (text: string) => {
  try {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
      throw new Error("No JSON object found in response");
    }
    const jsonStr = text.substring(firstBrace, lastBrace + 1);
    return JSON.parse(jsonStr);
  } catch (err: any) {
    console.error("JSON Extraction Error:", err);
    console.log("Raw text that failed to parse:", text);
    throw new Error(`Failed to parse AI response as JSON: ${err.message}`);
  }
};

export interface AIResponse {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
}

export const callVertexAI = async (
  modelConfig: ModelConfig,
  prompt: string,
  projectId: string,
  gcloudAccessToken: string
): Promise<AIResponse> => {
  const endpoint = "aiplatform.googleapis.com";
  let url = "";
  let body = {};

  if (modelConfig.provider === 'google') {
    url = `https://${endpoint}/v1/projects/${projectId}/locations/global/publishers/google/models/${modelConfig.id}:generateContent`;
    body = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 64000,
        temperature: 1
      }
    };
  } else if (modelConfig.provider === 'anthropic') {
    url = `https://${endpoint}/v1/projects/${projectId}/locations/global/publishers/anthropic/models/${modelConfig.id}:streamRawPredict`;
    body = {
      anthropic_version: "vertex-2023-10-16",
      messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
      max_tokens: 64000,
      temperature: 1,
    };
  } else {
    // Kimi
    const region = 'us-east5';
    url = `https://${endpoint}/v1beta1/projects/${projectId}/locations/${region}/endpoints/openapi/chat/completions`;
    body = {
      model: modelConfig.id,
      messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
      max_tokens: 64000,
      temperature: 0.7,
    };
  }

  const startTime = performance.now();
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${gcloudAccessToken}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Vertex AI Error (${modelConfig.name}): ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const endTime = performance.now();
  const latencyMs = Math.round(endTime - startTime);

  let text = "";
  let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

  if (modelConfig.provider === 'google') {
    text = data.candidates[0].content.parts[0].text;
    if (data.usageMetadata) {
      usage = {
        promptTokens: data.usageMetadata.promptTokenCount || 0,
        completionTokens: data.usageMetadata.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata.totalTokenCount || 0,
      };
    }
  } else if (modelConfig.provider === 'anthropic') {
    text = data.content[0].text;
    if (data.usage) {
      usage = {
        promptTokens: data.usage.input_tokens || 0,
        completionTokens: data.usage.output_tokens || 0,
        totalTokens: (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0),
      };
    }
  } else {
    text = data.choices[0].message.content;
    if (data.usage) {
      usage = {
        promptTokens: data.usage.prompt_tokens || 0,
        completionTokens: data.usage.completion_tokens || 0,
        totalTokens: data.usage.total_tokens || 0,
      };
    }
  }

  return { text, usage, latencyMs };
};
