"use client";
import { deleteproductByID } from "@/app/actions";
import { CustomButton } from "@/components/ui";
import { BASE_URL } from "@/constant";
import React, { useState } from "react";
import { AiFillDelete } from "react-icons/ai";

const DeleteProduct = ({ id }) => {
  const [loading, setLoading] = useState(false);
  const onDeleteMyProduct = async (id) => {
    if (id) {
      const userConfirmed = window.confirm(
        "Are you sure you want to delete this product?"
      );
      if (userConfirmed) {
        try {
          setLoading(true);
          const response = await fetch(`${BASE_URL}/product/product-delete/${id}`, {
            method: "GET",
          });
          if (response.ok) {
            await deleteproductByID();
          } else {
            console.error("Failed to delete banner");
          }
          alert("Product deleted successfully!");
          // setInterested(!interested); // Uncomment if necessary
        } catch (error) {
          console.error("Error deleting product:", error);
          alert("There was an error deleting the product. Please try again.");
        } finally {
          setLoading(false);
        };
      }
    } else {
      // router.push("/login");
    }
  };

  return (
    <CustomButton
      className="!py-2.5 !bg-custom-red"
      onClick={() => {
        onDeleteMyProduct(id);
      }}
    >
      <AiFillDelete />
    </CustomButton>
  );
};

export default DeleteProduct;
