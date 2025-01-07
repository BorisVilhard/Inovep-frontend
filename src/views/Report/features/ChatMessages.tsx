'use client';

import React from 'react';
import { Message } from '..';

interface ChatMessagesProps {
  messages: Message[];
  chatParentRef: React.RefObject<HTMLUListElement>;
}

export default function ChatMessages({ messages, chatParentRef }: ChatMessagesProps) {
  return (
    <section className="container mx-auto mb-[100px] flex h-[50vh] max-w-3xl flex-grow flex-col gap-4 rounded-b-2xl bg-neutral-10 px-0 pb-10">
      <ul
        ref={chatParentRef}
        className="flex h-1 flex-grow flex-col gap-4 overflow-y-auto rounded-lg p-4"
      >
        {messages.map((m, index) => (
          <div key={index}>
            {m.role === 'user' ? (
              <li className="flex flex-row">
                <div className="bg-background flex rounded-xl bg-primary-90 p-4 text-shades-white shadow-md">
                  <p className="text-primary">{m.content}</p>
                </div>
              </li>
            ) : (
              <li className="flex flex-row-reverse">
                <div className="bg-background flex w-3/4 rounded-xl bg-shades-white p-4 shadow-md">
                  <p className="text-primary">{m.content}</p>
                </div>
              </li>
            )}
          </div>
        ))}
      </ul>
    </section>
  );
}
