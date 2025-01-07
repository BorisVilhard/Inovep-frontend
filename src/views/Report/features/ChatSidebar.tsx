'use client';

import React from 'react';
import { Chat } from '..';

interface ChatSidebarProps {
  chats: Chat[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
}

export default function ChatSidebar({ chats, currentChatId, onSelectChat }: ChatSidebarProps) {
  return (
    <aside className="hidden w-[25%] overflow-y-auto p-4 lg:block">
      <div className="rounded-t-2xl bg-gray-900 p-6">
        <h2 className="mb-4 text-xl font-bold text-white">Your Chats</h2>
      </div>

      <ul className="h-[50vh] bg-neutral-10">
        {chats.map((chat) => (
          <li
            key={chat._id}
            className={`mb-2 cursor-pointer rounded p-2 ${
              currentChatId === chat._id ? 'bg-neutral-40' : 'bg-neutral-10'
            }`}
            onClick={() => onSelectChat(chat._id)}
          >
            {chat.dashboardName ? (
              <>
                Dashboard: {chat.dashboardName} <br />
              </>
            ) : null}
            Chat ID: {chat._id.substring(0, 6)}... <br />
            {new Date(chat.createdAt).toLocaleString()}
          </li>
        ))}
      </ul>
    </aside>
  );
}
