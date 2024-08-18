import React, { useEffect, useState } from 'react';

const ImageFetcher: React.FC = () => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchImage = async () => {
      setLoading(true);
      try {
        // Adjust the URL to where your Flask server is running
        const response = await fetch('http://localhost:5000/process-image');
        if (!response.ok) throw new Error('Network response was not ok');
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setImageUrl(url);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
      }
      setLoading(false);
    };

    fetchImage();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  console.log(imageUrl);
  return (
    <div>
      <h1>Processed Image</h1>
      {imageUrl && <img src={imageUrl} alt="Processed" />}
    </div>
  );
};

export default ImageFetcher;
