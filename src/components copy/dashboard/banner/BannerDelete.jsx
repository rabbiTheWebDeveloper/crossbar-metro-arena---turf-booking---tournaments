"use client";
import React, { useState } from "react";
import { BASE_URL } from "@/constant";
import { revalidatePath } from "next/cache";
import actionBanner from "@/app/actions";

const BannerDelete = ({ bannerId }) => {
  const [loading, setLoading] = useState(false);
  const handleDeleteBanner = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this banner?"
    );
    if (!confirmed) {
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`${BASE_URL}/banner-delete/${id}`, {
        method: "GET",
      });
      if (response.ok) {
       await actionBanner()
      } else {
        console.error("Failed to delete banner");
      }
    } catch (error) {
      console.error("Error deleting banner:", error);
    } finally {
      setLoading(false);
    };
  };
  return (
    <button
      onClick={() => handleDeleteBanner(bannerId)}
      className="text-red-500 hover:text-red-700"
      disabled={loading}
    >
      Delete
    </button>
  );
};

export default BannerDelete;
