"use client"
import React from "react";

const Faq = () => {
  const [openIndex, setOpenIndex] = React.useState<null | number>(null);

  const faqs = [
    {
      question: "How is this different from platforms like Codeforces or LeetCode?",
      answer: "Codeforces focuses on DSA and algorithms. Our platform focuses on development — testing server-side logic, APIs etc",
    },
    {
      question: "How are submissions evaluated?",
      answer: "Your code is executed against real test files. Results are judged based on correctness, edge cases, and expected output.",
    },
    {
      question: "Who can create problems on this platform?",
      answer: "Institutes, educators, and companies can create custom challenges with their own test files.",
    },
    {
      question: "Is the platform framework-specific?",
      answer: "No",
    },
  ];
  return (
    <>

      <div className="max-w-2xl mx-auto  py-9 flex flex-col tracking-tight items-center  text-gray-800 justify-center px-4 md:px-0">

        <h1 className="text-5xl mb-12 font-semibold tracking-tight  text-center">Looking for answer?</h1>

        {faqs.map((faq, index) => (
          <div className="border-b border-slate-200 py-4 cursor-pointer w-full" key={index} onClick={() => setOpenIndex(openIndex === index ? null : index)}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-medium">
                {faq.question}
              </h3>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${openIndex === index ? "rotate-180" : ""} transition-all duration-500 ease-in-out`}>
                <path d="m4.5 7.2 3.793 3.793a1 1 0 0 0 1.414 0L13.5 7.2" stroke="#1D293D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className={`text-sm text-slate-500 transition-all tracking-normal duration-500 ease-in-out max-w-md ${openIndex === index ? "opacity-100 max-h-[300px] translate-y-0 pt-4" : "opacity-0 max-h-0 -translate-y-2"}`} >
              {faq.answer}
            </p>
          </div>
        ))}
      </div>

    </>
  );
};

export default Faq;
