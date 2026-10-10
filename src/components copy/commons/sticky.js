"use client";

import Image from "next/image";
import Link from "next/link";
import animationCall from "../../../public/assets/gif/call.gif";
import animationWhatsApp from "../../../public/assets/gif/whats.gif";

export default function StickyIcon({ setting }) {
  return (
    <div className="fixed bottom-5 right-1 flex flex-col gap-1">
      <Link href={`tel:${setting?.phoneNumber}`}>
        <Image
          src={animationCall}
          alt="whats"
          width="50"
          height="50"
          quality={85}
          className="w-10 tab:w-14 h-10 tab:h-14 rounded-full"
        />
      </Link>
      <Link href={``} target="_blank">
        <Image
          src={animationWhatsApp}
          alt="whats"
          width="50"
          height="50"
          quality={85}
          className="w-10 tab:w-14 h-10 tab:h-14 rounded-full"
        />
      </Link>
    </div>
  );
}
