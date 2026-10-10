import React from 'react';

export const metadata = {
  title: 'Investor Portal | Crossbar Metro Arena',
  description: 'Confidential equity partner and profit share distribution console for Crossbar Metro Arena.'
};

export default function InvestorRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#060906] text-slate-100 font-sans antialiased selection:bg-[#bef264] selection:text-black">
      {children}
    </div>
  );
}
