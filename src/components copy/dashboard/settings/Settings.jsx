/* eslint-disable @next/next/no-img-element */
"use client";
import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  CustomButton,
  CustomCart,
  CustomContainer,
  CustomInput,
} from '@/components/ui';
import { H2, P } from '@/components/ui/tags';
import { useRouter } from 'next/navigation';
import { IoMdCloudUpload } from 'react-icons/io';
import { BASE_URL } from '@/constant';

export default function Settings({ user, setting }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formValues, setFormValues] = useState({
    websiteName: setting?.websiteName || '',
    metaLink: setting?.metaLink || '',
    logo: null,
    favIcon: null,
    phoneNumber: setting?.phoneNumber || '',
    whatsappNumber: setting?.whatsappNumber || '',
    facebookLink: setting?.facebookLink || '',
    instagramLink: setting?.instagramLink || '',
    youtubeLink: setting?.youtubeLink || '',
    twitterLink: setting?.twitterLink || '',
    sectionName: setting?.sectionName || '',
    sectionDes: setting?.sectionDes || '',
  });

  const [logoPreview, setLogoPreview] = useState(setting?.logo || '');
  const [favIconPreview, setFavIconPreview] = useState(setting?.favIcon || '');

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'logo' || name === 'favIcon') {
      const file = files[0];
      setFormValues({ ...formValues, [name]: file });
      if (name === 'logo') {
        setLogoPreview(URL.createObjectURL(file));
      } else {
        setFavIconPreview(URL.createObjectURL(file));
      }
    } else {
      setFormValues({ ...formValues, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      Object.keys(formValues).forEach(key => {
        if (formValues[key] !== null) {
          formData.append(key, formValues[key]);
        }
      });

      const response = await fetch(BASE_URL + '/setting-update', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        alert('Settings saved successfully');
        router.push('/dashboard/setting');  // Adjust this path as needed
      } else {
        throw new Error('Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('There was an error updating the settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="my-10">
      <CustomContainer>
        <CustomCart className="w-full tab:w-[50%] m-auto">
          <form onSubmit={handleSubmit} className="grid tab:grid-cols-2 gap-5">
            <H2 name="Setting" className="text-center tab:col-span-2" />

            {Object.keys(formValues).map(key => (
              key !== '_id' && (
                <div key={key} className="flex flex-col gap-2">
                  <P name={key.replace(/([A-Z])/g, ' $1')} />
                  {key === 'logo' || key === 'favIcon' ? (
                    <label className="relative w-full h-64 border-2 border-dashed border-gray-300 flex items-center justify-center rounded-lg cursor-pointer">
                      <IoMdCloudUpload className="text-gray-400 text-6xl z-10" />
                      <input
                        name={key}
                        type="file"
                        onChange={handleChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      {key === 'logo' && logoPreview && (
                        <img
                          src={logoPreview}
                          alt="Logo Preview"
                          className="absolute inset-0 w-[50%] h-auto m-auto object-contain"
                        />
                      )}
                      {key === 'favIcon' && favIconPreview && (
                        <img
                          src={favIconPreview}
                          alt="Favicon Preview"
                          className="absolute inset-0 w-[50%] h-auto m-auto object-contain"
                        />
                      )}
                    </label>
                  ) : (
                    <CustomInput
                      type="text"
                      name={key}
                      placeholder={`Enter your ${key.replace(/([A-Z])/g, ' $1')}`}
                      value={formValues[key]}
                      onChange={handleChange}
                    />
                  )}
                </div>
              )
            ))}

            <div className="flex flex-col gap-2 tab:col-span-2">
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
                  'Submit'
                )}
              </button>
            </div>
          </form>
        </CustomCart>
      </CustomContainer>
    </section>
  );
}
