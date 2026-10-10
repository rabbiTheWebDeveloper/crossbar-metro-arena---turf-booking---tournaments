/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */
import React from "react";

const Navbar = () => (
  <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 shadow-sm border-b border-gray-200">
    <div className="container mx-auto px-6 py-4 flex justify-between items-center">
      <div className="flex items-center space-x-3">
  <svg 
    className="w-9 h-9 text-indigo-600" 
    fill="none" 
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" 
    />
  </svg>
  <div className="flex flex-col">
    <span className="text-xl font-bold text-gray-800 leading-tight">FunnelLine</span>
    <span className="text-xs font-medium text-indigo-600 uppercase tracking-wider">Affiliate Program</span>
  </div>
</div>
      <div className="hidden md:flex space-x-8">
        <a href="#features" className="text-gray-600 hover:text-indigo-600 font-medium">Benefits</a>
        <a href="#pricing" className="text-gray-600 hover:text-indigo-600 font-medium">Pricing</a>
        <a href="#testimonials" className="text-gray-600 hover:text-indigo-600 font-medium">Success Stories</a>
        <a href="#payouts" className="text-gray-600 hover:text-indigo-600 font-medium">Payouts</a>
      </div>
      <a href="/register" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition">
        Join Now
      </a>
    </div>
  </nav>
);

const HeroSection = () => (
  <section className="bg-gradient-to-r from-indigo-600 to-purple-500 text-white pt-32 pb-24">
    <div className="container mx-auto px-6 flex flex-col lg:flex-row items-center gap-16">
      <div className="flex-1 text-center lg:text-left">
        <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
          Earn Recurring Commissions with Every Referral
        </h1>
        <p className="text-xl text-gray-200 mb-8">
          Join our partner program and earn up to 35% recurring commissions with premium marketing resources.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <a href="/register" className="bg-green-500 text-white px-8 py-4 rounded-lg font-bold hover:bg-green-600 shadow-lg transition">
            Start Earning Now →
          </a>
          <a href="#pricing" className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition">
            See Commission Plans
          </a>
        </div>
      </div>
      <div className="flex-1">
        <img src="https://cdn.iconscout.com/icon/premium/png-512-thumb/affiliate-marketing-2653330-2200510.png?f=webp&w=512" 
             className="w-full max-w-lg animate-float" 
             alt="Affiliate marketing illustration" />
      </div>
    </div>
  </section>
);

const FeatureCard = ({ title, description }) => (
  <div className="p-8 rounded-xl border border-gray-200 bg-white shadow-md transition hover:shadow-lg">
    <h3 className="text-xl font-semibold mb-4">{title}</h3>
    <p className="text-gray-500">{description}</p>
  </div>
);

const FeaturesSection = () => (
  <section id="features" className="py-20">
    <div className="container mx-auto px-6 text-center">
      <h2 className="text-4xl font-bold text-gray-900 mb-6">Why Join FunnelLiner?</h2>
      <p className="text-lg text-gray-600 mb-12">Premium benefits for top affiliates</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <FeatureCard title="35% Recurring Commissions" description="Earn commissions every month with 90-day cookies." />
        <FeatureCard title="Fast Payouts" description="Get paid monthly via PayPal, Wire Transfer, or Crypto." />
        <FeatureCard title="Marketing Support" description="Access high-converting landing pages and ads." />
      </div>
    </div>
  </section>
);

const PricingTier = ({ range, commission, bgColor, textColor }) => (
  <div className={`p-6 rounded-xl ${bgColor} ${textColor} shadow-lg transition transform hover:scale-105`}>
    <h3 className="text-2xl font-bold mb-2">{range}</h3>
    <p className="text-3xl font-extrabold mb-4">{commission}</p>
    <p className="text-lg">per successful referral</p>
  </div>
);

const PricingSection = () => (
  <section id="pricing" className="py-20 bg-gray-50">
    <div className="container mx-auto px-6">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">Commission Plans</h2>
        <p className="text-xl text-gray-600">Earn more as you refer more customers</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <PricingTier 
          range="0-20 Referrals" 
          commission="৳800" 
          bgColor="bg-indigo-100" 
          textColor="text-indigo-800" 
        />
        <PricingTier 
          range="21-50 Referrals" 
          commission="৳1200" 
          bgColor="bg-purple-100" 
          textColor="text-purple-800" 
        />
        <PricingTier 
          range="51-80 Referrals" 
          commission="৳1400" 
          bgColor="bg-blue-100" 
          textColor="text-blue-800" 
        />
        <PricingTier 
          range="81-120 Referrals" 
          commission="৳1600" 
          bgColor="bg-green-100" 
          textColor="text-green-800" 
        />
        <PricingTier 
          range="120+ Referrals" 
          commission="৳1800" 
          bgColor="bg-yellow-100" 
          textColor="text-yellow-800" 
        />
      </div>
      
      <div className="mt-12 bg-white p-8 rounded-xl shadow-md border border-gray-200">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">How Commissions Work</h3>
        <p className="text-gray-600 mb-6">
          Your commission per referral increases as you reach higher tiers. All commissions are recurring monthly payments based on your referred customers' active subscriptions.
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left text-gray-700 font-semibold">Referral Range</th>
                <th className="py-3 px-4 text-left text-gray-700 font-semibold">Commission per Referral</th>
                <th className="py-3 px-4 text-left text-gray-700 font-semibold">Monthly Potential (20 referrals)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-3 px-4">0-20</td>
                <td className="py-3 px-4 font-medium">৳800</td>
                <td className="py-3 px-4">৳16,000</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="py-3 px-4">21-50</td>
                <td className="py-3 px-4 font-medium">৳1,200</td>
                <td className="py-3 px-4">৳24,000</td>
              </tr>
              <tr>
                <td className="py-3 px-4">51-80</td>
                <td className="py-3 px-4 font-medium">৳1,400</td>
                <td className="py-3 px-4">৳28,000</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="py-3 px-4">81-120</td>
                <td className="py-3 px-4 font-medium">৳1,600</td>
                <td className="py-3 px-4">৳32,000</td>
              </tr>
              <tr>
                <td className="py-3 px-4">120+</td>
                <td className="py-3 px-4 font-medium">৳1,800</td>
                <td className="py-3 px-4">৳36,000</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
);

const TestimonialsSection = () => (
  <section id="testimonials" className="py-20 bg-gray-900 text-white">
    <div className="container mx-auto px-6 text-center">
      <h3 className="text-3xl font-bold mb-8">What Our Affiliates Say</h3>
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
        <p className="text-lg leading-relaxed">"FunnelLiner's affiliate program helped me generate passive income. The support team is amazing!"</p>
        <span className="block mt-4 font-semibold">- Sarah Johnson, Top Affiliate</span>
      </div>
    </div>
  </section>
);

const CTASection = () => (
  <section className="bg-gradient-to-r from-indigo-600 to-purple-500 py-24 text-white text-center">
    <h2 className="text-4xl font-bold mb-6">Start Earning Today!</h2>
    <p className="text-xl mb-8">Join thousands of successful affiliates already growing with FunnelLiner.</p>
    <a href="/register" className="bg-green-500 px-8 py-4 rounded-xl text-lg font-bold shadow-lg hover:bg-green-600 transition">
      Join Now →
    </a>
  </section>
);

const Footer = () => (
  <footer className="bg-gray-900 text-gray-400 py-12 text-center">
    <p>© 2025 FunnelLiner. All rights reserved.</p>
  </footer>
);

const AffiliateProgram = () => {
  return (
    <div>
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <TestimonialsSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default AffiliateProgram;