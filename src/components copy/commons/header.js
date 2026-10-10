"use client";

import Image from "next/image";
import { CustomContainer } from "../ui";

import Link from "next/link";
import { usePathname } from "next/navigation";
import logo from "../../../public/assets/logo.webp";

import { useState } from "react";

import { HiMiniBars3BottomRight } from "react-icons/hi2";
import { IoCloseCircleOutline } from "react-icons/io5";

import {
  FaFacebookF,
  FaInstagram,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa";
import { H4 } from "../ui/tags";

// menus
const menus = [
  {
    id: crypto.randomUUID(),
    name: "Home",
    url: "/",
  },

  // {
  //   id: crypto.randomUUID(),
  //   name: "Contact Us",
  //   url: "#",
  // },
];

// social-icon
const socialIcons = [
  {
    id: crypto.randomUUID(),
    icon: <FaFacebookF />,
    url: "/",
  },
  {
    id: crypto.randomUUID(),
    icon: <FaInstagram />,
    url: "/",
  },
  {
    id: crypto.randomUUID(),
    icon: <FaWhatsapp />,
    url: "/",
  },
  {
    id: crypto.randomUUID(),
    icon: <FaYoutube />,
    url: "/",
  },
];

export default function Menubar({ setting }) {
  const route = usePathname();

  const [isOpen, setIsOpen] = useState(false);

  const handleSideMenu = () => {
    setIsOpen(true);
  };

  // handleCloseToggle
  const handleCloseToggle = () => {
    setIsOpen(false);
  };

  return (
    <>
      <div className="sticky top-0 left-0 z-[999] w-full shadow py-3 bg-white">
        <CustomContainer>
          {/*  */}
          <div className="flex items-center justify-between">
            {/* left */}
            <div className="">
              {/* <Link href="/">
                <Image
                  src={setting?.logo ? setting?.logo : logo}
                  alt="logo"
                  width="80"
                  height="80"
                  quality={85}
                  className="w-12 laptop:w-16 h-12 laptop:h-16"
                />
              </Link> */}
            </div>

            {/* menu */}
            <div className="hidden tab:block">
              <ul className="flex items-center gap-5">
                {menus.map((menu) => (
                  <li key={menu.id}>
                    <Link
                      href={menu.url}
                      className={`text-lg font-medium text-custom-text2 hover:text-primary-color1 ${
                        route === menu.url ? "text-primary-color1" : ""
                      }`}
                    >
                      {menu.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* social-icon */}
            <div className="hidden tab:block">
              <ul className="flex items-center gap-2">
                {/* {socialIcons.map((icon) => ( */}
                <li>
                  <Link
                    href={setting?.facebookLink}
                    target="_blank"
                    className="w-9 h-9 text-lg rounded-full bg-custom-bg1 flex items-center justify-center text-custom-text2 hover:bg-primary-color1 hover:text-white"
                  >
                    <FaFacebookF />
                  </Link>
                </li>

                <li>
                  <Link
                    href={setting?.instagramLink}
                    target="_blank"
                    className="w-9 h-9 text-lg rounded-full bg-custom-bg1 flex items-center justify-center text-custom-text2 hover:bg-primary-color1 hover:text-white"
                  >
                    <FaInstagram />
                  </Link>
                </li>
                <li>
                  <Link
                    href={`https://wa.me/${setting?.whatsappNumber}`}
                    target="_blank"
                    className="w-9 h-9 text-lg rounded-full bg-custom-bg1 flex items-center justify-center text-custom-text2 hover:bg-primary-color1 hover:text-white"
                  >
                    <FaWhatsapp />
                  </Link>
                </li>

                <li>
                  <Link
                    href={setting?.youtubeLink}
                    target="_blank"
                    className="w-9 h-9 text-lg rounded-full bg-custom-bg1 flex items-center justify-center text-custom-text2 hover:bg-primary-color1 hover:text-white"
                  >
                    <FaYoutube />
                  </Link>
                </li>
                {/* ))} */}
              </ul>
            </div>

            {/* mobile menu */}
            <div className="w-auto block tab:hidden">
              <div
                className="text-2xl text-custom-text1"
                onClick={handleSideMenu}
              >
                <HiMiniBars3BottomRight />
              </div>

              <div className="">
                {isOpen && (
                  <div className="w-full h-full fixed top-0 left-0 z-10 bg-[#00000075]">
                    <div className="w-[90%] h-full shadow bg-white">
                      {/* header */}
                      <div className="mb-3 border-b border-custom-border p-3 flex items-center justify-between">
                        <H4 name="Menu" />

                        <div
                          className="text-2xl text-custom-red cursor-pointer"
                          onClick={handleCloseToggle}
                        >
                          <IoCloseCircleOutline />
                        </div>
                      </div>

                      {/* menu */}
                      <div className="px-5">
                        <ul className="flex flex-col gap-3">
                          {menus.map((menu) => (
                            <li key={menu.id}>
                              <Link
                                href={menu.url}
                                className={`text-lg font-medium text-custom-text2 hover:text-primary-color1 ${
                                  route === menu.url
                                    ? "text-primary-color1"
                                    : ""
                                }`}
                              >
                                {menu.name}
                              </Link>
                            </li>
                          ))}
                        </ul>

                        <ul className="flex items-center gap-2 mt-5">
                          {socialIcons.map((icon) => (
                            <li key={icon.id}>
                              <Link
                                href={icon.url}
                                className="w-9 h-9 text-lg rounded-full bg-custom-bg1 flex items-center justify-center text-custom-text2 hover:bg-primary-color1 hover:text-white"
                              >
                                {icon.icon}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CustomContainer>
      </div>
    </>
  );
}
