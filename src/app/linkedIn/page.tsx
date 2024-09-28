// src/components/LinkedInScraper.tsx
'use client';
import React, { useState } from 'react';
import axios from 'axios';

interface ProfileData {
  name: string;
  headline: string;
  about: string;
  experience: string[];
  education: string[];
  skills: string[];
}

export default function linkedIn() {
  const [profileURL, setProfileURL] = useState('');
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleScrape = async () => {
    if (!profileURL) {
      setError('Please enter a LinkedIn profile URL.');
      return;
    }

    setLoading(true);
    setError('');
    setProfileData(null);

    try {
      const response = await axios.get<ProfileData>(`http://localhost:3500/linkedin`, {
        params: { profileURL },
      });
      setProfileData(response.data);
    } catch (err) {
      setError('Failed to scrape LinkedIn profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 p-6">
      <h1 className="mb-6 text-3xl font-bold text-blue-600">LinkedIn Profile Scraper</h1>

      <div className="w-full max-w-md">
        <input
          type="text"
          value={profileURL}
          onChange={(e) => setProfileURL(e.target.value)}
          placeholder="Enter LinkedIn profile URL"
          className="mb-4 w-full rounded border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleScrape}
          disabled={loading}
          className="w-full rounded bg-blue-500 py-2 text-white transition duration-200 hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Scraping...' : 'Scrape Profile'}
        </button>
      </div>

      {error && <p className="mt-4 text-red-500">{error}</p>}

      {profileData && (
        <div className="mt-8 w-full max-w-2xl rounded bg-white p-6 shadow">
          <h2 className="mb-4 text-2xl font-semibold">Profile Data:</h2>
          <p>
            <strong>Name:</strong> {profileData.name}
          </p>
          <p>
            <strong>Headline:</strong> {profileData.headline}
          </p>
          <p>
            <strong>About:</strong> {profileData.about}
          </p>

          <h3 className="mb-2 mt-6 text-xl font-semibold">Experience:</h3>
          <ul className="list-inside list-disc space-y-2">
            {profileData.experience.map((exp, index) => (
              <li key={index}>{exp}</li>
            ))}
          </ul>

          <h3 className="mb-2 mt-6 text-xl font-semibold">Education:</h3>
          <ul className="list-inside list-disc space-y-2">
            {profileData.education.map((edu, index) => (
              <li key={index}>{edu}</li>
            ))}
          </ul>

          <h3 className="mb-2 mt-6 text-xl font-semibold">Skills:</h3>
          <ul className="list-inside list-disc space-y-2">
            {profileData.skills.map((skill, index) => (
              <li key={index}>{skill}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
