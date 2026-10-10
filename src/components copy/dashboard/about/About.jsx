"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";

export default function About({ getAffiliateReports, userId }) {
  const [currentTime, setCurrentTime] = useState(null); // Initial state is null
  const [showPaymentDetails, setShowPaymentDetails] = useState(false); // State to toggle table visibility

  useEffect(() => {
    setCurrentTime(new Date()); // Set time once the component is mounted

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer); // Cleanup timer on component unmount
  }, []);

  const formattedDate =
    currentTime &&
    currentTime.toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const formattedTime = currentTime && currentTime.toLocaleTimeString();
  return (
    <section className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <div className="w-full bg-blue-50 p-4 shadow-md mb-6">
        <marquee behavior="scroll" direction="left" scrollamount="8">
          {/* Offer Links */}
          <Link
            href={`https://offer.funnelliner.com/?ref=${userId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-md transition mx-6"
          >
            Offer 1: Available for 3-20 users. Each user earns 800 Taka!
          </Link>
          {/* Other offer links go here */}
        </marquee>
      </div>

      <div className="w-full max-w-4xl bg-white shadow-lg rounded-lg p-8 text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Welcome to the Dashboard!
        </h1>
        {formattedDate && formattedTime ? (
          <>
            <p className="text-gray-600 mb-4 text-lg">
              Today is <span className="font-medium">{formattedDate}</span>
            </p>
            <p className="text-gray-600 mb-6 text-lg">
              Current time: <span className="font-medium">{formattedTime}</span>
            </p>
          </>
        ) : (
          <p className="text-gray-600 mb-4 text-lg">Loading current time...</p>
        )}

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 bg-blue-50 p-6 rounded-md shadow-md">
          <Link
            href={`https://offer.funnelliner.com/?ref=${userId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-md transition"
          >
            Visit Affiliate Link
          </Link>

          <button
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-md transition"
            onClick={() => {
              navigator.clipboard.writeText(
                `https://offer.funnelliner.com/?ref=${userId}`
              );
              alert("Affiliate link copied to clipboard!");
            }}
          >
            Copy Link
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
        <StatisticCard
          title="Total URL Clicks"
          value={getAffiliateReports?.active || 0}
          color="blue"
        />
        <StatisticCard
          title="Total Sign Up"
          value={getAffiliateReports?.total_list || 0}
          color="blue"
        />
        <StatisticCard
          title="Payment Missing"
          value={getAffiliateReports?.payment_miss || 0}
          color="blue"
        />
        <StatisticCard
          title="Total Payment Success"
          value={getAffiliateReports?.payment_success || 0}
          color="green"
        />
        <StatisticCard
          title="Total Payment Success Approved"
          value={getAffiliateReports?.payment_success_approved || 0}
          color="green"
        />
        <StatisticCard
          title="Pending Earnings"
          value={getAffiliateReports?.pending_payment || 0}
          color="yellow"
        />

        {/* Paid Amount Card with Details Button */}
        <div className="bg-red-50 p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Paid Amount
          </h2>
          <p className="text-3xl font-bold text-red-800">
            {getAffiliateReports?.approved_payment || 0}
          </p>
          <button
            onClick={() => setShowPaymentDetails(!showPaymentDetails)}
            className="mt-4 bg-red-500 text-white font-semibold py-2 px-4 rounded-md"
          >
            {showPaymentDetails ? "Hide Details" : "View Details"}
          </button>

          {/* Payment Details Table */}
          {showPaymentDetails && (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                      ID
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                      Amount
                    </th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Replace with actual payment data */}
                  {getAffiliateReports?.payment_list?.map((payment) => (
                    <tr key={payment._id} className="border-t">
                      <td className="px-4 py-2 text-sm text-gray-800">
                        {payment._id}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-800">
                        {payment.amount}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-800">
                        {new Date(payment.date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile Responsive: Stack table rows into columns on smaller screens */}
              <div className="overflow-x-auto md:hidden">
                {getAffiliateReports?.payment_list?.map((payment) => (
                  <div
                    key={payment._id}
                    className="flex flex-col border-b py-4 px-4 text-sm"
                  >
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-600">ID:</span>
                      <span>{payment._id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-600">
                        Amount:
                      </span>
                      <span>{payment.amount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-600">Date:</span>
                      <span>{new Date(payment.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// Reusable Statistic Card Component
const StatisticCard = ({ title, value, color }) => {
  const colorStyles = {
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-800",
      title: "text-blue-600",
    },
    green: {
      bg: "bg-green-50",
      text: "text-green-800",
      title: "text-green-600",
    },
    yellow: {
      bg: "bg-yellow-50",
      text: "text-yellow-800",
      title: "text-yellow-600",
    },
    red: {
      bg: "bg-red-50",
      text: "text-red-800",
      title: "text-red-600",
    },
  };

  return (
    <div className={`${colorStyles[color].bg} p-4 rounded-lg shadow-md`}>
      <h2 className={`text-xl font-semibold ${colorStyles[color].title} mb-2`}>
        {title}
      </h2>
      <p className={`text-3xl font-bold ${colorStyles[color].text}`}>{value}</p>
    </div>
  );
};
