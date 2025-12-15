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

export const callVertexAI = async (
  modelConfig: ModelConfig,
  prompt: string,
  projectId: string,
  gcloudAccessToken: string
) => {
  const endpoint = "aiplatform.googleapis.com";
  let url = "";
  let body = {};

  if (modelConfig.provider === 'anthropic') {
    url = `https://${endpoint}/v1/projects/${projectId}/locations/global/publishers/anthropic/models/${modelConfig.id}:streamRawPredict`;
    body = {
      anthropic_version: "vertex-2023-10-16",
      messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
      max_tokens: 64000,
      temperature: 1,
    };
  } else {
    // Kimi or Llama (MaaS)
    const region = 'us-east5';
    url = `https://${endpoint}/v1beta1/projects/${projectId}/locations/${region}/endpoints/openapi/chat/completions`;
    body = {
      model: modelConfig.id,
      messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
      max_tokens: 64000,
      temperature: 0.7,
    };
  }

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

  if (modelConfig.provider === 'anthropic') {
    return data.content[0].text;
  } else {
    return data.choices[0].message.content;
  }
};
