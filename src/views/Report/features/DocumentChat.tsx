'use client';
import React, { useRef, useEffect, useState } from 'react';
import { useChat, Message } from 'ai/react';
import Button from '@/app/components/Button/Button';
import Dropdown from '@/app/components/Dropdown/Dropdown';
import { MdOutlineAttachFile } from 'react-icons/md';

const generateId = () => `id-${Date.now()}-${Math.random()}`;

function DocumentChat() {
  const { messages, input, handleInputChange, setMessages } = useChat({
    api: 'http://localhost:3500/chat',
    onError: (e) => {
      console.error('Chat error:', e);
    },
  });
  const chatParent = useRef<HTMLUListElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    const domNode = chatParent.current;
    if (domNode) {
      domNode.scrollTop = domNode.scrollHeight;
    }
  }, [messages]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Add the new file to the files array
      setFiles((prevFiles) => [...prevFiles, file]);
      // Set the new file as the selected file
      setSelectedFile(file);
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const content = btoa(reader.result as string);
        resolve(content);
      };
      reader.onerror = reject;
      reader.readAsBinaryString(file);
    });
  };

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!input.trim() && !selectedFile) {
      console.log('Please enter a message or upload a file.');
      return;
    }

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: input,
    };

    setMessages([...messages, userMessage]);

    let fileContent = '';
    if (selectedFile) {
      fileContent = await readFileAsBase64(selectedFile);
    }

    const payload = {
      messages: [...messages, userMessage],
      fileContent: fileContent,
      fileName: selectedFile ? selectedFile.name : '',
      fileType: selectedFile ? selectedFile.type : '',
    };

    try {
      const response = await fetch('http://localhost:3500/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Failed to submit:', errorData);
        return;
      }

      // Process the response stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulatedText += decoder.decode(value, { stream: true });
        }

        const newMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: accumulatedText.trim(),
        };
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }

    handleInputChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
    // Optionally reset the selected file after submission
    // setSelectedFile(null);
  };

  return (
    <main className="bg-background flex h-screen max-h-dvh w-full max-w-3xl flex-col items-center justify-center">
      <section className="flex w-full max-w-3xl flex-col items-center justify-start gap-7 rounded-t-2xl bg-gray-900 px-[85px] py-[25px]">
        <header className="mx-auto flex w-full max-w-3xl items-center border-b p-4">
          <h1 className="w-full text-2xl font-bold text-shades-white">Document Report</h1>
          <Dropdown
            name="files"
            className="w-[250px]"
            items={files}
            value={selectedFile}
            placeholder="Select a file"
            onChange={(file) => setSelectedFile(file)}
          />
        </header>
        <form
          onSubmit={handleFormSubmit}
          className="mx-auto flex w-full max-w-3xl items-center gap-5"
        >
          <div>
            <input id="file" style={{ display: 'none' }} type="file" onChange={handleFileChange} />
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

      <section className="container mx-auto mb-[100px] flex max-w-3xl flex-grow flex-col gap-4 rounded-b-2xl bg-neutral-20 px-0 pb-10">
        <ul
          ref={chatParent}
          className="flex h-1 flex-grow flex-col gap-4 overflow-y-auto rounded-lg p-4"
        >
          {messages.map((m, index) => (
            <div key={index}>
              {m.role === 'user' ? (
                <li key={m.id} className="flex flex-row">
                  <div className="bg-background flex rounded-xl bg-primary-90 p-4 text-shades-white shadow-md">
                    <p className="text-primary">{m.content}</p>
                  </div>
                </li>
              ) : (
                <li key={m.id} className="flex flex-row-reverse">
                  <div className="bg-background flex w-3/4 rounded-xl bg-shades-white p-4 shadow-md">
                    <p className="text-primary">{m.content}</p>
                  </div>
                </li>
              )}
            </div>
          ))}
        </ul>
      </section>
    </main>
  );
}

export default DocumentChat;
