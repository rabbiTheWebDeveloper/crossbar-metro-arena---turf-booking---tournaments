"use client";
import actionBanner from '@/app/actions';
import { BASE_URL } from '@/constant';
import React, { useState } from 'react';

const CreateBanner = () => {
  const [newBanner, setNewBanner] = useState(null);
  const [imageName, setImageName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAddBanner = async () => {
    if (!imageName || !newBanner) {
      setError('Please enter an image name and select an image file.');
      return;
    }

    const formData = new FormData();
    formData.append('name', imageName);
    formData.append('image', newBanner);

    try {
      setLoading(true);
      const response = await fetch(BASE_URL + '/addBanner', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        const addedBanner = await response.json();
        setNewBanner(null);
        setImageName('');
        setError(null);
        await actionBanner();
      } else {
        console.error('Failed to add banner');
        setError('Failed to add banner. Please try again later.');
      }
    } catch (error) {
      console.error('Error adding banner:', error);
      setError('Error adding banner. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event) => {
    setNewBanner(event.target.files[0]);
  };

  return (
    <div className="w-full max-w-md mb-6">
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <input
        type="text"
        required
        value={imageName}
        onChange={(e) => setImageName(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded mb-2"
        placeholder="Enter image name"
      />
      <input
        type="file"
        required
        accept="image/*"
        onChange={handleFileChange}
        className="w-full p-2 border border-gray-300 rounded mb-2"
      />
      <button
        onClick={handleAddBanner}
        className={`w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Add Banner'}
      </button>
    </div>
  );
};

export default CreateBanner;
