import { SITE_URL } from "@/constant";
import logo from "../../public/assets/logo.webp";

export const metadata = {
  title: "شراء اثاث مستعمل بالدمام | شراء الاثاث المستعمل بالجبيل",
  description:
    "شراء اثاث مستعمل بالدمام  | شراء الاثاث المستعمل بالجبيل | بالدمام والخبر القطيف | الشرقية نشتري غرف نوم  | ثلاجه مکیفات مستعمل | خربانة سكراب جميع انواع | الالكترونيات ",
};
export const jsonLdArabic = {
  "@context": "https://www.usedaircondituner.com/",
  "@type":
    "شراء اثاث مستعمل بالدمام | شراء الاثاث المستعمل بالجبيل | 0531013347",
  name: "شراء اثاث مستعمل بالدمام | شراء الاثاث المستعمل بالجبيل",
  description:
    "اعثر على أفضل العروض على الأثاث المستعمل في الجبيل، الدمام، الخبر، والقطيف.     شراء اثاث مستعمل بالدمام  | شراء الاثاث المستعمل بالجبيل | بالدمام والخبر القطيف | الشرقية نشتري غرف نوم | ثلاجه مکیفات مستعمل | خربانة سكراب جميع انواع | الالكترونيات ",
  address: {
    "@type": "PostalAddress",
    addressLocality:
      "الجبيل شراء اثاث مستعمل بالدمام  | شراء الاثاث المستعمل بالجبيل | بالدمام والخبر القطيف | الشرقية نشتري غرف نوم  | ثلاجه مکیفات مستعمل | خربانة سكراب جميع انواع | الالكترونيات",
    addressRegion: "المنطقة الشرقية",
    addressCountry: "المملكة العربية السعودية",
  },
};

export const jsonLdEnglish = {
  "@context": "https://www.usedaircondituner.com/",
  "@type": "شراء اثاث مستعمل بالدمام | شراء الاثاث المستعمل بالجبيل",
  name: "Your Company Name",
  description:
    "Find the best deals on used furniture in Jubail, Dammam, Khobar, and Qatif.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Jubail",
    addressRegion: "Eastern Province",
    addressCountry: "Saudi Arabia",
  },
};

export const jsonLdOrganization = {
  "@context": "https://www.usedaircondituner.com/",
  "@type": "Organization",
  name: "ALI Haqwi",
  url: SITE_URL,
  logo: SITE_URL + logo,
  sameAs: [
    "https://www.facebook.com/yourprofile",
    "https://www.instagram.com/yourprofile",
    "https://www.linkedin.com/in/yourprofile",
  ],
};