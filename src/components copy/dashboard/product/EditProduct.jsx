/* eslint-disable @next/next/no-img-element */
"use client";
import QuillEditor from "@/components/QuillEditor";
import { CustomCart, CustomContainer, CustomInput } from "@/components/ui";
import { H2, P } from "@/components/ui/tags";
import { BASE_URL } from "@/constant";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { IoMdCloudUpload } from "react-icons/io";
import { IoArrowBackOutline } from "react-icons/io5";

export default function EditProduct({ productDetails, id }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [productShortDescription, setProductShortDescription] = useState(
    productDetails.longDescription
  );
  const [formValues, setFormValues] = useState({
    image: null,
    title: productDetails.title,
    description: productDetails.description,
    longDescription: productDetails.longDescription,
    youtubeLink: productDetails.youtubeLink || "",
  });

  const [imagePreview, setImagePreview] = useState(productDetails.image || ""); // State for image preview

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      const file = files[0];
      setFormValues({ ...formValues, [name]: file });
      setImagePreview(URL.createObjectURL(file)); // Set image preview
    } else {
      setFormValues({ ...formValues, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", formValues.title);
      formData.append("description", formValues.description);
      formData.append("longDescription", formValues.longDescription);
      formData.append("youtubeLink", formValues.youtubeLink);

      if (formValues.image) {
        formData.append("image", formValues.image); // Assuming formValues.image is a File object
      }

      const response = await fetch(BASE_URL + "/product/product-update/" + id, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("Product created successfully");
        router.push("/dashboard/product");
      } else {
        throw new Error("Failed to create product");
      }

      setLoading(false);
    } catch (error) {
      console.error("Error creating product:", error);
      alert("There was an error creating the product. Please try again.");
      setLoading(false);
    }
  };

  const getYouTubeEmbedUrl = (url) => {
    const videoId = url.split("v=")[1]?.split("&")[0];
    return `https://www.youtube.com/embed/${videoId}`;
  };

  return (
    <section className="my-10">
      <CustomContainer>
        <CustomCart className="">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 tab:grid-cols-3 gap-5">
            <div className="tab:col-span-3 flex flex-col tab:flex-row gap-2 items-center justify-between">
              <H2 name="Product Update" className="" />
              <Link
                href="/dashboard/product"
                className="flex items-center gap-1 bg-primary-color1 text-white py-2 px-5 rounded "
              >
                <IoArrowBackOutline className="text-xl" />
                Back
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              <P name="Product Image" />
              <label className="relative w-full h-64 border-2 border-dashed border-gray-300 flex items-center justify-center rounded-lg cursor-pointer">
                <IoMdCloudUpload className="text-gray-400 text-6xl z-10" />
                <CustomInput
                  name="image"
                  type="file"
                  onChange={handleChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Product Preview"
                    className="absolute inset-0 w-[70%] h-auto m-auto object-contain"
                  />
                )}
              </label>
            </div>
            <div className="flex flex-col gap-2">
              <P name="Product Title" />
              <CustomInput
                name="title"
                type="text"
                placeholder="Enter product title"
                value={formValues.title}
                onChange={handleChange}
                className="custom-input"
              />
            </div>
            <div className="flex flex-col gap-2">
              <P name="Product Description" />
              <CustomInput
                name="description"
                type="text"
                placeholder="Enter product description"
                value={formValues.description}
                onChange={handleChange}
                className="custom-input"
              />
            </div>
            <div className="flex flex-col gap-2 tab:col-span-3">
              <P name="Product Long Description" />
              <QuillEditor
                value={productShortDescription}
                onChange={(value) => {
                  setFormValues({ ...formValues, longDescription: value });
                  setProductShortDescription(value);
                }}
                placeholder="Please describe your product long description"
              />
            </div>
            <div className="flex flex-col gap-2 tab:col-span-3">
              <P name="YouTube Video Link" />
              <CustomInput
                name="youtubeLink"
                type="text"
                placeholder="Enter YouTube video link"
                value={formValues.youtubeLink}
                onChange={handleChange}
                className="custom-input"
              />
              {formValues.youtubeLink && (
                <iframe
                  className="mt-2"
                  width="290"
                  height="200"
                  src={getYouTubeEmbedUrl(formValues.youtubeLink)}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="YouTube video preview"
                ></iframe>
              )}
            </div>
            <div className="flex flex-col gap-2 tab:col-span-3">
              <button
                type="submit"
                className="w-full bg-primary-color1 text-white py-1.5 px-5 rounded-lg text-base font-medium"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-3 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      ></path>
                    </svg>
                    Loading...
                  </div>
                ) : (
                  "Submit"
                )}
              </button>
            </div>
          </form>
        </CustomCart>
      </CustomContainer>
    </section>
  );
}
