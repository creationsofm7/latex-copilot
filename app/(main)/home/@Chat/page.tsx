"use client";

import { useText } from "../Context";
import { useChat } from "@ai-sdk/react";
import { useState } from "react"; // Import useState

// Helper function to extract LaTeX content
const LATEX_DELIMITER = "[%LATEX%]";

function extractLatex(content: string): { pre: string; latex: string | null; post: string } {
  const firstDelimiterIndex = content.indexOf(LATEX_DELIMITER);
  if (firstDelimiterIndex === -1) {
    return { pre: content, latex: null, post: "" };
  }

  const secondDelimiterIndex = content.indexOf(LATEX_DELIMITER, firstDelimiterIndex + LATEX_DELIMITER.length);
  if (secondDelimiterIndex === -1) {
    return { pre: content, latex: null, post: "" }; // Malformed or only one delimiter
  }

  const pre = content.substring(0, firstDelimiterIndex);
  const latex = content.substring(firstDelimiterIndex + LATEX_DELIMITER.length, secondDelimiterIndex);
  const post = content.substring(secondDelimiterIndex + LATEX_DELIMITER.length);

  return { pre, latex, post };
}

export default function Chat() {
  const { text, setText } = useText();
  const [finishedMessageIds, setFinishedMessageIds] = useState<Set<string>>(new Set());

  const { messages, input, setInput, append, status } = useChat({
    onFinish: (message) => {
      if (message.role === "assistant") {
        setFinishedMessageIds((prevIds) => new Set(prevIds).add(message.id));
      }
    },
  });
  return (
    <div className="bg-background/50 backdrop-blur-sm border border-foreground/10 rounded-lg h-[90vh] overflow-auto w-full flex flex-col">
      <div className="p-4 border-b border-foreground/10">
        <h3 className="text-lg font-semibold select-none">Chat</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div>
          {messages.map((message, index) => {
            let displayParts: { pre: string; latex: string | null; post: string } | null = null;
            let latexToAccept: string | null = null;
            let isStreamingAssistantMessage = false;

            if (message.role === "assistant") {
              if (finishedMessageIds.has(message.id)) {
                // Message is finished, parse it
                const parsed = extractLatex(message.content);
                displayParts = parsed;
                latexToAccept = parsed.latex;
              } else {
                // Message is streaming or not yet finished
                isStreamingAssistantMessage = true;
                displayParts = { pre: message.content, latex: null, post: "" };
                latexToAccept = null; // Accept button will use full content if clicked during streaming
              }
            }

            return (
              <div
                key={index}
                className={`rounded-xl p-2 my-1 w-fit max-w-[80%] ${
                  message.role === "user"
                    ? "bg-blue-500 text-white ml-auto"
                    : "bg-gray-200 text-gray-800 mr-auto"
                }`}
              >
                {message.role === "user" ? (
                  <span className="font-semibold">User:</span>
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Assistant:</span>
                    <button
                      onClick={() => {
                        if (latexToAccept !== null) {
                          setText(latexToAccept);
                        } else {
                          setText(message.content.toString());
                        }
                      }}
                      className="ml-2 px-2 py-0.5 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                    >
                      Accept
                    </button>
                  </div>
                )}
                {message.role === "assistant" && (
                  <div className="text-sm text-gray-500 mt-1">
                    Original length: {message.content.length}
                  </div>
                )}
                <div className="text-sm p-2 whitespace-pre-wrap">
                  {message.role === "user" ? (
                    message.content
                  ) : isStreamingAssistantMessage ? ( // If assistant message is streaming
                    message.content // Show raw content
                  ) : displayParts ? ( // If assistant message is complete and parsed
                    <>
                      <span>{displayParts.pre}</span>
                      {displayParts.latex && (
                        <span className="bg-indigo-100 text-indigo-700 p-1 mx-1 rounded font-mono inline-block">
                          {displayParts.latex}
                        </span>
                      )}
                      <span>{displayParts.post}</span>
                    </>
                  ) : (
                    message.content // Fallback for assistant message
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className=" border-t border-foreground/10">
        <div className="flex flex-col gap-2">
          <input
            value={input}
            type="text"
            className="p-2"
            onChange={(event) => {
              setInput(event.target.value);
            }}
            onKeyDown={async (event) => {
              if (event.key === "Enter" && !(status === 'submitted' || status === 'streaming')) {
                append({ content: input, role: "user" });
                setInput(''); // Clear input after sending
              }
            }}
            disabled={status === 'submitted' || status === 'streaming'}
          />
          <button
            className="self-end m-2 px-2 py-1 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50"
            onClick={() => {
              if (input.trim() && !(status === 'submitted' || status === 'streaming')) {
                append({ content: input, role: "user" });
                setInput(''); // Clear input after sending
              }
            }}
            disabled={status === 'submitted' || status === 'streaming' || !input.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
