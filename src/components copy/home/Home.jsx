"use client";
import { useState } from "react";
import Head from "next/head";
import {
  FaArrowRight,
  FaExclamationCircle,
  FaInfoCircle,
  FaCheck,
  FaChevronDown,
  FaChevronUp,
  FaStar,
  FaStarHalfAlt,
  FaEnvelope,
  FaTelegram,
  FaPaypal,
  FaMoneyBillWave,
  FaBitcoin,
  FaBars,
  FaImages,
  FaWallet,
  FaMobileAlt,
  FaHeadset,
  FaGift,
  FaQuestionCircle,
} from "react-icons/fa";
import Link from "next/link";

export default function Home() {
  const [activeFAQ, setActiveFAQ] = useState(null);

  const toggleFAQ = (index) => {
    setActiveFAQ(activeFAQ === index ? null : index);
  };

  const packages = [
    {
      name: "GOLD",
      title: "1 Course",
      price: "$450",
      border: "border-yellow-400",
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      button: "bg-yellow-500 hover:bg-yellow-600",
      features: [
        "Access to 1 premium course",
        "Method access included",
        "Telegram updates",
        "Basic support",
      ],
      popular: false,
      savings: null,
    },
    {
      name: "PREMIUM",
      title: "2 Courses",
      price: "$600",
      border: "border-purple-500",
      bg: "bg-purple-100",
      text: "text-purple-800",
      button: "bg-purple-500 hover:bg-purple-600",
      features: [
        "Access to 2 premium courses",
        "Method access included",
        "Priority Telegram updates",
        "Priority support",
        "Bonus materials",
      ],
      popular: true,
      savings: "Save $300 compared to individual purchases",
    },
    {
      name: "PLATINUM",
      title: "3 Courses",
      price: "$800",
      border: "border-blue-400",
      bg: "bg-blue-100",
      text: "text-blue-800",
      button: "bg-blue-500 hover:bg-blue-600",
      features: [
        "Access to all 3 premium courses",
        "Method access included",
        "Exclusive Telegram group",
        "24/7 VIP support",
        "All bonus materials",
        "1-on-1 consultation",
      ],
      popular: false,
      savings: "Save $550 compared to individual purchases",
    },
  ];

  const features = [
    {
      icon: <FaImages className="text-3xl mb-4 text-purple-600" />,
      title: "Course Previews",
      description:
        "Browse course previews and detailed descriptions to make informed decisions about your education.",
    },
    {
      icon: <FaWallet className="text-3xl mb-4 text-purple-600" />,
      title: "Flexible Payments",
      description:
        "Multiple secure payment options including bKash, Nagad, PayPal, and cryptocurrency for your convenience.",
    },
    {
      icon: <FaTelegram className="text-3xl mb-4 text-purple-600" />,
      title: "Telegram Community",
      description:
        "Join our active Telegram community for real-time updates, support, and networking with other students.",
    },
    {
      icon: <FaMobileAlt className="text-3xl mb-4 text-purple-600" />,
      title: "Responsive Design",
      description:
        "Access all materials and resources from any device with our fully responsive platform.",
    },
    {
      icon: <FaHeadset className="text-3xl mb-4 text-purple-600" />,
      title: "Dedicated Support",
      description:
        "Our support team is available to help you with any questions or technical issues you may encounter.",
    },
    {
      icon: <FaGift className="text-3xl mb-4 text-purple-600" />,
      title: "Gift Card System",
      description:
        "Learn our proven gift card to cash flow system that works across different IPs and numbers for sustainable income.",
    },
  ];

  const testimonials = [
    {
      initials: "AS",
      name: "Ahmed S.",
      role: "Premium Member",
      quote:
        '"The gift card method alone has paid for my entire course investment 10 times over. The step-by-step guidance is invaluable."',
      rating: 5,
    },
    {
      initials: "MR",
      name: "Maria R.",
      role: "Platinum Member",
      quote:
        '"I went from zero to $3k/month using the methods taught here. The VIP support is worth every penny when you\'re starting out."',
      rating: 5,
    },
    {
      initials: "TJ",
      name: "Tariq J.",
      role: "Gold Member",
      quote:
        '"The Telegram group updates keep me ahead of the curve. I\'ve tried other courses but none provide this level of ongoing support."',
      rating: 4.5,
    },
  ];

  const faqs = [
    {
      question: "How do I access the courses after purchase?",
      answer:
        "After completing your purchase, you'll receive an email with login credentials and instructions to access your courses. You'll also be invited to our private Telegram group for updates.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept bKash, Nagad, PayPal, and various cryptocurrencies. Payment instructions will be provided after you select your package.",
    },
    {
      question: "Is there a money-back guarantee?",
      answer:
        "Due to the digital nature of our products, we don't offer refunds. However, we provide extensive course previews and detailed descriptions so you can make an informed decision before purchasing.",
    },
    {
      question: "How often are methods updated?",
      answer:
        "Methods are updated as needed, typically every 1-2 months. All updates are shared immediately in our Telegram group, and major updates trigger email notifications.",
    },
  ];

  return (
    <div className="bg-gray-50 text-gray-800 font-sans">
      <Head>
        <title>Method Agency | Premium Online Courses</title>
        <meta
          name="description"
          content="Premium courses designed to help you master online income streams and build sustainable wealth"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-blue-400 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold">Method Agency</h1>
              <p className="mt-1 text-purple-100">
                Premium Courses & Financial Solutions
              </p>
            </div>
            <nav className="hidden md:flex space-x-6">
              <Link
                href="/"
                className="text-white hover:text-purple-200 font-medium transition-colors duration-300 relative group"
              >
                Home
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-300 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link
                href="/courses"
                className="text-white hover:text-purple-200 font-medium transition-colors duration-300 relative group"
              >
                Courses
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-300 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link
                href="/methods"
                className="text-white hover:text-purple-200 font-medium transition-colors duration-300 relative group"
              >
                Methods
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-300 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link
                href="/testimonials"
                className="text-white hover:text-purple-200 font-medium transition-colors duration-300 relative group"
              >
                Testimonials
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-300 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link
                href="/contact"
                className="text-white hover:text-purple-200 font-medium transition-colors duration-300 relative group"
              >
                Contact
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-300 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link
                href="/login"
                className="ml-4 px-4 py-2 bg-white text-purple-600 rounded-lg font-medium hover:bg-purple-100 hover:text-purple-700 transition-colors duration-300 shadow-sm hover:shadow-md"
              >
                Login
              </Link>
            </nav>
            <button className="md:hidden text-white">
              <FaBars className="text-2xl" />
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Unlock Your Financial Freedom
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              Premium courses designed to help you master online income streams
              and build sustainable wealth
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-bold hover:bg-purple-100 transition duration-300 flex items-center justify-center">
                Explore Courses <FaArrowRight className="ml-2" />
              </button>
              <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-bold hover:bg-white hover:text-purple-600 transition duration-300">
                Join Telegram
              </button>
            </div>
          </div>
        </section>
      </header>

      {/* Notice Banner */}
      <section className="max-w-5xl mx-auto my-8 px-4">
        <div className="bg-yellow-100 p-4 rounded-lg border-l-4 border-yellow-500 text-yellow-800 flex items-start">
          <FaExclamationCircle className="text-xl mr-3 mt-1" />
          <div>
            <p className="font-semibold">Important Notice!</p>
            <p>
              From Friday, method-only purchases will be closed. You must
              purchase any one of the courses below to get method access.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center mb-4">
          Our Premium Packages
        </h2>
        <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
          Choose the package that fits your learning needs and budget. All
          packages include method access and Telegram group membership.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {packages.map((pkg, index) => (
            <div
              key={index}
              className={`bg-white p-8 rounded-xl shadow-lg text-center border-t-4 ${
                pkg.border
              } transition-all duration-300 hover:translate-y-[-5px] hover:shadow-xl relative ${
                pkg.popular ? "transform scale-105" : ""
              }`}
            >
              {pkg.popular && (
                <div className="absolute top-0 right-0 bg-purple-500 text-white font-bold py-1 px-4 rounded-bl-lg text-sm">
                  POPULAR
                </div>
              )}
              <div
                className={`${pkg.bg} ${pkg.text} font-bold py-1 px-3 rounded-full text-sm inline-block mb-4`}
              >
                {pkg.name}
              </div>
              <h3 className="text-2xl font-bold mb-2">{pkg.title}</h3>
              <p className="text-4xl font-bold mb-4">{pkg.price}</p>
              {pkg.savings && (
                <p
                  className={`${pkg.text.replace(
                    "800",
                    "600"
                  )} font-medium mb-4`}
                >
                  {pkg.savings}
                </p>
              )}
              <ul className="text-left space-y-3 mb-8">
                {pkg.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <FaCheck className="text-green-500 mr-2 mt-1" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                className={`w-full ${pkg.button} text-white font-bold py-3 px-4 rounded-lg transition duration-300`}
              >
                Select Package
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Info Banner */}
      <section className="max-w-5xl mx-auto my-8 px-4">
        <div className="bg-green-100 p-4 rounded-lg border-l-4 border-green-500 text-green-800 flex items-start">
          <FaInfoCircle className="text-xl mr-3 mt-1" />
          <div>
            <p className="font-semibold">New System Coming!</p>
            <p>
              From Sunday, all new users will be enrolled into the income
              system. All updates will be available through Telegram.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-4 py-16 bg-white">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Why Choose Rafiqul Agency?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We provide comprehensive solutions to help you succeed in the
            digital economy
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-gray-50 p-8 rounded-xl hover:shadow-md transition duration-300"
            >
              {feature.icon}
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="max-w-6xl mx-auto px-4 py-16 bg-purple-50">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Success Stories</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Hear from our students who have transformed their financial
            situations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center mb-4">
                <div className="bg-purple-100 text-purple-800 w-12 h-12 rounded-full flex items-center justify-center font-bold mr-4">
                  {testimonial.initials}
                </div>
                <div>
                  <h4 className="font-bold">{testimonial.name}</h4>
                  <p className="text-gray-500 text-sm">{testimonial.role}</p>
                </div>
              </div>
              <p className="text-gray-600">{testimonial.quote}</p>
              <div className="flex mt-4 text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <span key={i}>
                    {i < Math.floor(testimonial.rating) ? (
                      <FaStar />
                    ) : i === Math.floor(testimonial.rating) &&
                      testimonial.rating % 1 !== 0 ? (
                      <FaStarHalfAlt />
                    ) : (
                      <FaStar className="text-gray-300" />
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-600">
            Find answers to common questions about our courses and methods
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <button
                className="w-full flex justify-between items-center p-4 text-left font-medium bg-gray-50 hover:bg-gray-100"
                onClick={() => toggleFAQ(index)}
              >
                <span>{faq.question}</span>
                {activeFAQ === index ? <FaChevronUp /> : <FaChevronDown />}
              </button>
              <div
                className={`p-4 bg-white ${
                  activeFAQ === index ? "block" : "hidden"
                }`}
              >
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-purple-600 to-blue-400 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Income?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join hundreds of students who are already building sustainable
            income streams with our proven methods.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-bold hover:bg-purple-100 transition duration-300 flex items-center justify-center mx-auto">
              Enroll Now <FaArrowRight className="ml-2" />
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-bold hover:bg-white hover:text-purple-600 transition duration-300 flex items-center justify-center mx-auto">
              <FaQuestionCircle className="mr-2" /> Ask Questions
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-12 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-bold mb-4">Method Agency</h3>
              <p className="text-gray-400">
                Providing premium financial education and methods since 2020.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    Home
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    Courses
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    Testimonials
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Contact</h3>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-400">
                  <FaEnvelope className="mr-2" /> support@rafiqulagency.com
                </li>
                <li className="flex items-center text-gray-400">
                  <FaTelegram className="mr-2" /> t.me/Methodlagency
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Payment Methods</h3>
              <div className="flex space-x-4">
                <div className="bg-gray-800 p-2 rounded">
                  <FaPaypal className="text-2xl" />
                </div>
                <div className="bg-gray-800 p-2 rounded">
                  <FaMoneyBillWave className="text-2xl" />
                </div>
                <div className="bg-gray-800 p-2 rounded">
                  <FaBitcoin className="text-2xl" />
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} Method Agency. All rights
              reserved.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white">
                <FaTelegram />
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <FaTelegram /> {/* Replace with Twitter icon if needed */}
              </a>
              <a href="#" className="text-gray-400 hover:text-white">
                <FaTelegram /> {/* Replace with Instagram icon if needed */}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
