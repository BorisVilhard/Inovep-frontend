'use client';
import React, { useRef, useEffect, useState } from 'react';
import Button from '@/app/components/Button/Button';
import { MdOutlineAttachFile } from 'react-icons/md';
import useStore from '@/views/auth/api/userReponse';
import axios from 'axios';

const generateId = () => `id-${Date.now()}-${Math.random()}`;

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface Chat {
  _id: string;
  createdAt: string;
}

function DocumentChat() {
  const [chatId, setChatId] = useState<string | null>(null); // Current chat ID
  const { id: userId, accessToken } = useStore(); // Retrieve userId and accessToken from store
  const [messages, setMessages] = useState<Message[]>([]); // Chat messages
  const [input, setInput] = useState<string>(''); // Current input
  const chatParent = useRef<HTMLUListElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [chats, setChats] = useState<Chat[]>([]); // List of chats
  const [fileContent, setFileContent] = useState<string>(''); // File content of the selected chat

  useEffect(() => {
    const domNode = chatParent.current;
    if (domNode) {
      domNode.scrollTop = domNode.scrollHeight;
    }
  }, [messages]);

  // Fetch chats on component mount
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await axios.get(`http://localhost:3500/chat/users/${userId}/chats`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response && response.status === 200) {
          setChats(response.data); // Update the chats state
        } else if (response.status === 204) {
          console.log('No chats found');
        } else {
          console.error('Failed to fetch chats:', response?.data);
        }
      } catch (error: any) {
        console.error('Error fetching chats:', error);
      }
    };

    fetchChats();
  }, [userId, accessToken]);

  // Handle chat selection
  const handleChatSelection = async (selectedChatId: string) => {
    try {
      const response = await axios.get(
        `http://localhost:3500/chat/users/${userId}/chats/${selectedChatId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (response && response.status === 200) {
        const chatData = response.data;
        setChatId(chatData._id);
        setMessages(chatData.messages);
        setFileContent(chatData.fileContent || '');
        console.log('Chat loaded:', chatData);
      } else {
        console.error('Failed to load chat:', response?.data);
      }
    } catch (error: any) {
      console.error('Error loading chat:', error);
    }
  };

  // Handle input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
  };

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // Convert file to base64
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === 'string' || result instanceof ArrayBuffer) {
          const binaryString =
            result instanceof ArrayBuffer ? String.fromCharCode(...new Uint8Array(result)) : result;
          const base64 = btoa(binaryString);
          resolve(base64);
        } else {
          reject(new Error('Failed to read file as binary string.'));
        }
      };
      reader.onerror = () => {
        reject(new Error('Error reading file.'));
      };
      reader.readAsArrayBuffer(file);
    });
  };

  // Handle form submission
  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!input.trim() && !selectedFile) {
      console.log('Please enter a message or upload a file.');
      return;
    }

    // Create user message
    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: input,
    };

    // Append user message to chat
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    let payload: any = {
      messages: [userMessage], // Sending only the new message
    };

    if (selectedFile) {
      try {
        const fileContentBase64 = await readFileAsBase64(selectedFile);
        payload.fileContent = fileContentBase64;
        payload.fileName = selectedFile.name;
        payload.fileType = selectedFile.type;
      } catch (error) {
        console.error('Error reading file:', error);
      }
    } else if (fileContent) {
      // Include existing file content if no new file is selected
      payload.fileContent = fileContent;
    }

    try {
      // Send message (create chat if it doesn't exist)
      const response = await axios.post(
        `http://localhost:3500/chat/users/${userId}/chats`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response && response.status === 200) {
        const assistantContent = response.data.message;

        if (assistantContent) {
          const assistantMessage: Message = {
            id: generateId(),
            role: 'assistant',
            content: assistantContent.trim(),
          };
          setMessages((prevMessages) => [...prevMessages, assistantMessage]);
        }

        // Store chatId if returned (useful for deleting)
        if (!chatId && response.data.chatId) {
          setChatId(response.data.chatId);
          // Fetch chats again to update the list
          setChats((prevChats) => [response.data.chatId, ...prevChats]);
        }
      } else {
        console.error('Failed to submit:', response?.data);
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
    }

    // Reset input and selected file
    setInput('');
    setSelectedFile(null);
  };

  return (
    <main className="bg-background flex h-screen max-h-dvh w-full flex-col items-center justify-center">
      <div className="flex w-full  justify-center ">
        <aside className="w-[25%] overflow-y-auto p-4">
          <div className=" rounded-t-2xl bg-gray-900 p-6">
            <h2 className="mb-4 text-xl  font-bold text-white">Your Chats</h2>
          </div>

          <ul className=" h-[50vh] bg-neutral-20">
            {chats.map((chat) => (
              <li
                key={chat._id}
                className={`mb-2 cursor-pointer rounded p-2 ${
                  chatId === chat._id ? 'bg-neutral-40' : 'bg-neutral-20'
                }`}
                onClick={() => handleChatSelection(chat._id)}
              >
                Chat ID: {chat._id.substring(0, 6)}... <br />
                {new Date(chat.createdAt).toLocaleString()}
              </li>
            ))}
          </ul>
        </aside>

        <div className="w-full max-w-3xl">
          <section className="flex w-full flex-col items-center justify-start gap-7 rounded-t-2xl bg-gray-900 px-10 py-6">
            <header className="mx-auto flex w-full items-center border-b p-4">
              <h1 className="w-full text-2xl font-bold text-shades-white">Document Report</h1>
              {selectedFile && <p className="text-shades-white">{selectedFile.name}</p>}
            </header>
            <form onSubmit={handleFormSubmit} className="mx-auto flex w-full items-center gap-5">
              <div>
                <input
                  id="file"
                  style={{ display: 'none' }}
                  type="file"
                  onChange={handleFileChange}
                />
                <label
                  className="flex cursor-pointer items-center justify-center rounded-lg border-none bg-shades-white p-[11px] hover:bg-neutral-20"
                  htmlFor="file"
                >
                  <span className="flex items-center text-[25px]">
                    <MdOutlineAttachFile />
                  </span>
                </label>
              </div>
              <input
                name="message"
                className="min-h-[40px] flex-1"
                placeholder="Type your question here..."
                type="text"
                value={input}
                onChange={handleInputChange}
              />
              <Button type="secondary" className="ml-2" htmlType="submit">
                Submit
              </Button>
            </form>
          </section>

          <section className="container mx-auto mb-[100px] flex h-[50vh] max-w-3xl flex-grow flex-col gap-4 rounded-b-2xl bg-neutral-20 px-0 pb-10">
            <ul
              ref={chatParent}
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
        </div>
      </div>
    </main>
  );
}

export default DocumentChat;
