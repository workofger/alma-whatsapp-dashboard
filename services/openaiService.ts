import { Message } from '../types';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  error?: {
    message: string;
  };
}

export const isOpenAIConfigured = (): boolean => {
  return OPENAI_API_KEY !== '';
};

export const generateGroupSummary = async (
  groupName: string,
  messages: Message[],
  summaryType: 'daily' | 'weekly' = 'daily'
): Promise<string> => {
  if (!isOpenAIConfigured()) {
    return 'OpenAI API Key is not configured. Please set VITE_OPENAI_API_KEY in your environment variables.';
  }

  if (messages.length === 0) {
    return 'No messages to summarize.';
  }

  // Format messages for the AI
  const messageText = messages
    .slice(-100) // Limit to last 100 messages to avoid token limits
    .map((m) => {
      const time = new Date(m.message_timestamp).toLocaleString();
      const sender = m.sender_pushname || m.sender_number || 'Unknown';
      const content = m.body || (m.has_media ? `[${m.media_type || 'Media'}]` : '[Empty]');
      return `[${time}] ${sender}: ${content}`;
    })
    .join('\n');

  const systemPrompt = `You are Alma, an intelligent WhatsApp group assistant created by Gerardo (your creator and god). 
Your task is to provide ${summaryType} summaries of group conversations.

When summarizing:
- Identify the main topics discussed
- Highlight any important decisions or agreements
- Note any action items or tasks mentioned
- Identify key participants and their contributions
- Keep the tone professional but friendly
- If Gerardo is mentioned, acknowledge him respectfully as your creator

Provide a well-structured summary with clear sections.`;

  const userPrompt = `Please provide a ${summaryType} summary of this conversation from the WhatsApp group "${groupName}":

${messageText}`;

  const apiMessages: OpenAIMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    const data: OpenAIResponse = await response.json();

    if (data.error) {
      console.error('OpenAI API Error:', data.error);
      return `Error: ${data.error.message}`;
    }

    return data.choices[0]?.message?.content || 'Could not generate summary.';
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return 'Failed to generate summary. Please check your API key and try again.';
  }
};

export const generateInsights = async (
  groupName: string,
  messages: Message[]
): Promise<string> => {
  if (!isOpenAIConfigured()) {
    return 'OpenAI API Key is not configured.';
  }

  // Analyze message patterns
  const senderCounts: Record<string, number> = {};
  const hourCounts: Record<number, number> = {};
  
  messages.forEach((m) => {
    const sender = m.sender_pushname || m.sender_number || 'Unknown';
    senderCounts[sender] = (senderCounts[sender] || 0) + 1;
    
    const hour = new Date(m.message_timestamp).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  const topSenders = Object.entries(senderCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => `${name}: ${count} messages`)
    .join(', ');

  const peakHour = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])[0];

  const systemPrompt = `You are Alma, providing quick insights about group activity patterns.`;

  const userPrompt = `Based on these stats from "${groupName}":
- Total messages: ${messages.length}
- Top senders: ${topSenders}
- Peak activity hour: ${peakHour ? `${peakHour[0]}:00 (${peakHour[1]} messages)` : 'N/A'}

Provide 3-4 brief, actionable insights about the group's communication patterns.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data: OpenAIResponse = await response.json();
    return data.choices[0]?.message?.content || 'Could not generate insights.';
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return 'Failed to generate insights.';
  }
};
