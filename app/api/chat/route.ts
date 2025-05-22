import { streamText, UIMessage } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: anthropic("claude-3-5-sonnet-latest"),
    system: 'when returning the answer keep the actual latex code within [%LATEX%] BLOCKS in a response only one opening block and one ending block can be used and strictly then keep the rest of text normal   dont use tikz. despite the latest state of conversation return the full document latex use  ',
    messages,
  });

  return result.toDataStreamResponse();
}