'use client';

import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';

import Button from '@/app/components/Button/Button';
import Dropdown, { DropdownItem } from '@/app/components/Dropdown/Dropdown';

import useAuthStore from '@/views/auth/api/userReponse';
import ChatMessages from './features/ChatMessages';
import ChatSidebar from './features/ChatSidebar';
import { generateId } from './utils/generateId';
import { DashboardCategory } from '@/types/types';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface Chat {
  _id: string;
  createdAt: string;
  dashboardId: string;
  dashboardName: string;
  messages: Message[];
  fileContent?: string;
}

// Helper function to restructure dashboard data.
function restructureData(dashboardData: DashboardCategory[] | null) {
  // If no valid data is provided, return an empty structure.
  if (!dashboardData || !Array.isArray(dashboardData)) {
    return { dashboardData: [] };
  }

  const finalData: {
    dashboardData: {
      categoryName: string;
      data: { title: string; value: number | string; date: string }[];
    }[];
  } = {
    dashboardData: [],
  };

  dashboardData.forEach((category) => {
    // Use a Map to group entries by title.
    type GroupType = {
      title: string;
      isNumber: boolean;
      // For numeric entries.
      sum: number;
      // For string entries.
      firstString: string;
      // Latest date among all entries (assumes ISO formatted date strings)
      latestDate: string;
    };

    const groupMap = new Map<string, GroupType>();

    category.mainData.forEach((mainItem) => {
      mainItem.data.forEach((entry) => {
        // If this title is not already in our map, initialize it.
        if (!groupMap.has(entry.title)) {
          if (typeof entry.value === 'number') {
            groupMap.set(entry.title, {
              title: entry.title,
              isNumber: true,
              sum: entry.value,
              firstString: '',
              latestDate: entry.date,
            });
          } else {
            groupMap.set(entry.title, {
              title: entry.title,
              isNumber: false,
              sum: 0,
              firstString: entry.value,
              latestDate: entry.date,
            });
          }
        } else {
          const group = groupMap.get(entry.title)!;
          // Update the latest date if the current entry's date is more recent.
          if (new Date(entry.date) > new Date(group.latestDate)) {
            group.latestDate = entry.date;
          }
          // Sum values if they are numbers.
          if (group.isNumber && typeof entry.value === 'number') {
            group.sum += entry.value;
          }
          // For non-numeric values, keep the first encountered string.
        }
      });
    });

    // Build the aggregated entries.
    const aggregatedData: { title: string; value: number | string; date: string }[] = [];
    groupMap.forEach((group) => {
      if (group.isNumber) {
        aggregatedData.push({ title: group.title, value: group.sum, date: group.latestDate });
      } else {
        aggregatedData.push({
          title: group.title,
          value: group.firstString,
          date: group.latestDate,
        });
      }
    });

    finalData.dashboardData.push({
      categoryName: category.categoryName,
      data: aggregatedData,
    });
  });

  return finalData;
}

function DocumentChat() {
  const [chatId, setChatId] = useState<string | null>(null);
  const { id: userId, accessToken } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const chatParent = useRef<HTMLUListElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [fileContent, setFileContent] = useState<string>('');
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

          if (dashboardItems.length > 0) {
            const defaultDashboard = dashboardItems[dashboardItems.length - 1];
            setSelectedDashboard({
              id: defaultDashboard.id,
              name: defaultDashboard.name?.toString() || '',
            });
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

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await axios.get(`http://localhost:3500/chat/users/${userId}/chats`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response && response.status === 200) {
          setChats(response.data);
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

  const handleDashboardSelect = async (dashboardId: string) => {
    const dashboard = dashboards.find((d) => d.id === dashboardId);
    if (dashboard) {
      setSelectedDashboard({ id: dashboard.id, name: dashboard.name?.toString() || '' });

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
          // Ensure we have a valid array before restructuring
          const receivedData = response.data.dashboardData || [];
          setDashboardData(restructureData(receivedData));

          const existingChat = chats.find((chat) => chat.dashboardId === dashboardId);
          if (existingChat) {
            loadChatData(existingChat._id);
          } else {
            setMessages([]);
            setChatId(null);
            setFileContent('');
          }
        } else {
          console.error('Failed to load dashboard data:', response?.data);
        }
      } catch (error: any) {
        console.error('Error loading dashboard data:', error);
      }
    }
  };

  const handleChatSelection = async (selectedChatId: string) => {
    await loadChatData(selectedChatId);
  };

  const loadChatData = async (selectedChatId: string) => {
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
        setSelectedDashboard({ id: chatData.dashboardId, name: chatData.dashboardName });

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
              const receivedData = dashboardResponse.data.dashboardData || [];
              setDashboardData(restructureData(receivedData));
              console.log('Dashboard data loaded:', dashboardResponse.data.dashboardData);
            } else {
              console.error('Failed to load dashboard data:', dashboardResponse?.data);
            }
          } catch (error: any) {
            console.error('Error loading dashboard data:', error);
          }
        }
      } else {
        console.error('Failed to load chat:', response?.data);
      }
    } catch (error: any) {
      console.error('Error loading chat:', error);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInput(event.target.value);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

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

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: input,
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);

    const payload: any = {
      messages: [userMessage],
      dashboardId: selectedDashboard.id,
      dashboardName: selectedDashboard.name,
      dashboardData: dashboardData,
    };

    try {
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
          setMessages((prev) => [...prev, assistantMessage]);
        }

        if (!chatId && response.data.chatId) {
          setChatId(response.data.chatId);
          setChats((prevChats) => [response.data.chat, ...prevChats]);
        }
      } else {
        console.error('Failed to submit message:', response?.data);
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
    }

    setInput('');
    setSelectedFile(null);
  };

  return (
    <main className="flex h-full max-h-dvh w-full flex-col items-center justify-center">
      <div className="flex w-full justify-center">
        <ChatSidebar chats={chats} currentChatId={chatId} onSelectChat={handleChatSelection} />

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
          <ChatMessages messages={messages} chatParentRef={chatParent} />
        </div>
      </div>
    </main>
  );
}

export default DocumentChat;
