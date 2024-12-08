'use client';

import React, { useRef, useEffect, useState } from 'react';
import Button from '@/app/components/Button/Button';
import { MdOutlineAttachFile } from 'react-icons/md';

import axios from 'axios';
import Dropdown, { DropdownItem } from '@/app/components/Dropdown/Dropdown';
import useAuthStore from '@/views/auth/api/userReponse';
import Test2 from '@/app/components/Test2';

const generateId = () => `id-${Date.now()}-${Math.random()}`;

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface Chat {
  _id: string;
  createdAt: string;
  dashboardId: string;
  dashboardName: string;
  messages: Message[];
  fileContent?: string;
}

function DocumentChat() {
  const [chatId, setChatId] = useState<string | null>(null); // Current chat ID
  const { id: userId, accessToken } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]); // Chat messages
  const [input, setInput] = useState<string>(''); // Current input
  const chatParent = useRef<HTMLUListElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [chats, setChats] = useState<Chat[]>([]); // List of chats
  const [fileContent, setFileContent] = useState<string>(''); // File content of the selected chat
  const [dashboards, setDashboards] = useState<DropdownItem[]>([]);
  const [selectedDashboard, setSelectedDashboard] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    const domNode = chatParent.current;
    if (domNode) {
      domNode.scrollTop = domNode.scrollHeight;
    }
  }, [messages]);

  // Fetch dashboards on component mount
  useEffect(() => {
    const fetchDashboards = async () => {
      try {
        const response = await axios.get(`http://localhost:3500/data/users/${userId}/dashboard`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response && response.status === 200) {
          const dashboardsData = response.data;
          const dashboardItems = dashboardsData.map((dashboard: any) => ({
            id: dashboard._id,
            name: dashboard.dashboardName,
          }));
          setDashboards(dashboardItems);

          // Set default selected dashboard to the last one
          if (dashboardItems.length > 0) {
            const defaultDashboard = dashboardItems[dashboardItems.length - 1];
            setSelectedDashboard(defaultDashboard);
            // Call handleDashboardSelect with the default dashboard id
            handleDashboardSelect(defaultDashboard.id);
          }
        } else if (response.status === 204) {
          console.log('No dashboards found');
        } else {
          console.error('Failed to fetch dashboards:', response?.data);
        }
      } catch (error: any) {
        console.error('Error fetching dashboards:', error);
      }
    };

    fetchDashboards();
  }, [userId, accessToken]);

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

  // Handle dashboard selection
  const handleDashboardSelect = async (dashboardId: string) => {
    const dashboard = dashboards.find((d) => d.id === dashboardId);
    if (dashboard) {
      setSelectedDashboard(dashboard);

      // Fetch the dashboard data
      try {
        const response = await axios.get(
          `http://localhost:3500/data/users/${userId}/dashboard/${dashboardId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        if (response && response.status === 200) {
          setDashboardData(response.data.dashboardData);
          console.log('Dashboard data loaded:', response.data.dashboardData);

          // Check if a chat already exists with this dashboard
          const existingChat = chats.find((chat) => chat.dashboardId === dashboardId);

          if (existingChat) {
            // Load the existing chat data directly
            try {
              const chatResponse = await axios.get(
                `http://localhost:3500/chat/users/${userId}/chats/${existingChat._id}`,
                {
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                  },
                },
              );

              if (chatResponse && chatResponse.status === 200) {
                const chatData = chatResponse.data;
                setChatId(chatData._id);
                setMessages(chatData.messages);
                setFileContent(chatData.fileContent || '');
              } else {
                console.error('Failed to load chat:', chatResponse?.data);
              }
            } catch (error: any) {
              console.error('Error loading chat:', error);
            }
          } else {
            // Reset messages and chatId for a new chat
            setMessages([]);
            setChatId(null);
          }
        } else {
          console.error('Failed to load dashboard data:', response?.data);
        }
      } catch (error: any) {
        console.error('Error loading dashboard data:', error);
      }
    }
  };

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
        setSelectedDashboard({
          id: chatData.dashboardId,
          name: chatData.dashboardName,
        });

        // Fetch the dashboard data directly
        if (chatData.dashboardId) {
          try {
            const dashboardResponse = await axios.get(
              `http://localhost:3500/data/users/${userId}/dashboard/${chatData.dashboardId}`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              },
            );

            if (dashboardResponse && dashboardResponse.status === 200) {
              setDashboardData(dashboardResponse.data.dashboardData);
              console.log('Dashboard data loaded:', dashboardResponse.data.dashboardData);
            } else {
              console.error('Failed to load dashboard data:', dashboardResponse?.data);
            }
          } catch (error: any) {
            console.error('Error loading dashboard data:', error);
          }
        }

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

  // Handle form submission
  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!input.trim() && !selectedFile) {
      console.log('Please enter a message or upload a file.');
      return;
    }

    if (!selectedDashboard) {
      console.log('Please select a dashboard.');
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
      dashboardId: selectedDashboard.id,
      dashboardName: selectedDashboard.name,
      dashboardData: dashboardData,
    };

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
          setChats((prevChats) => [response.data.chat, ...prevChats]);
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
    <main className="flex h-full max-h-dvh w-full flex-col items-center justify-center">
      <div className="flex w-full  justify-center ">
        <aside className="hidden w-[25%] overflow-y-auto p-4 lg:block">
          <div className=" rounded-t-2xl bg-gray-900 p-6">
            <h2 className="mb-4 text-xl  font-bold text-white">Your Chats</h2>
          </div>

          <ul className=" h-[50vh] bg-neutral-10">
            {chats.map((chat) => (
              <li
                key={chat._id}
                className={`mb-2 cursor-pointer rounded p-2 ${
                  chatId === chat._id ? 'bg-neutral-40' : 'bg-neutral-10'
                }`}
                onClick={() => handleChatSelection(chat._id)}
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

        <div className="w-full max-w-3xl">
          <section className="flex w-full flex-col items-center justify-start gap-7 rounded-t-2xl bg-gray-900 px-10 py-6">
            <header className="mx-auto flex w-full items-center border-b p-4">
              <h1 className="w-full text-2xl font-bold text-shades-white">Document Report</h1>
              <Dropdown
                items={dashboards}
                onSelect={handleDashboardSelect}
                placeholder={selectedDashboard?.name || 'Select Dashboard'}
                className="w-[250px]"
                selectedId={selectedDashboard?.id}
              />
            </header>
            <form
              onSubmit={handleFormSubmit}
              className="mx-auto flex w-full items-center gap-5 rounded-full bg-shades-white p-1"
            >
              <input
                name="message"
                className="ml-[20px] min-h-[40px] flex-1 outline-none"
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

          <section className="container mx-auto mb-[100px] flex h-[50vh] max-w-3xl flex-grow flex-col gap-4 rounded-b-2xl bg-neutral-10 px-0 pb-10">
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
      <Test2 />
    </main>
  );
}

export default DocumentChat;
