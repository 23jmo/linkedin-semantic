'use client';

import { useEffect, useState } from 'react';
import { FaSpinner } from 'react-icons/fa';

interface LoadingIndicatorProps {
  messages: string[];
}

export default function LoadingIndicator({ messages }: LoadingIndicatorProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [displayedMessages, setDisplayedMessages] = useState<string[]>([]);
  
  useEffect(() => {
    // Add the latest message to the displayed messages
    if (messages.length > displayedMessages.length) {
      setDisplayedMessages(messages);
    }
    
    // Cycle through messages for the current message indicator
    const interval = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % messages.length);
    }, 2000);
    
    return () => clearInterval(interval);
  }, [messages, displayedMessages.length]);
  
  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-center mb-6">
        <FaSpinner className="animate-spin text-blue-600 mr-3" size={24} />
        <h2 className="text-xl font-semibold">Searching...</h2>
      </div>
      
      <div className="space-y-4">
        {displayedMessages.map((message, index) => (
          <div 
            key={index} 
            className={`flex items-start ${index === currentMessageIndex ? 'text-blue-600 font-medium' : 'text-gray-600'}`}
          >
            <span className="mr-2">•</span>
            <p>{message}</p>
          </div>
        ))}
      </div>
      
      <div className="mt-6 w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-in-out" 
          style={{ width: `${Math.min(100, (displayedMessages.length / 10) * 100)}%` }}
        ></div>
      </div>
    </div>
  );
} 