import React, { useState } from 'react';

export type ChatData = {
  question: string;
  answer: string;
};

interface Props {
  data: ChatData[];
}

const Chat = ({ data }: Props) => {
  return (
    <>
      {data && (
        <div className="my-5 h-[60vh] max-w-[75%] space-y-4 overflow-y-scroll rounded-lg border border-gray-300 p-4 shadow-lg">
          {data.map((item, index) => (
            <div key={index} className="w-full space-y-4">
              <div className="rounded-lg bg-blue-100 p-3">
                <p className="font-semibold text-blue-900">Q: {item.question}</p>
              </div>
              <div className="rounded-lg p-3">
                <p className="font-semibold text-shades-black">A: {item.answer}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default Chat;
