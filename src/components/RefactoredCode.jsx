import React, { useState } from "react";
import { MdContentCopy, MdDone } from "react-icons/md";

const RefactoredCode = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  return (
    <div className="rounded-lg border border-gray-700 bg-[#0f1115] overflow-hidden">
      <div className="flex items-center justify-between px-[15px] py-[10px] border-b border-gray-700 bg-[#12121B]">
        <p className="text-[13px] text-gray-400">refactored.js</p>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-[6px] text-[13px] text-gray-300 hover:text-white cursor-pointer"
        >
          {copied ? <MdDone /> : <MdContentCopy />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      <pre className="p-[15px] text-[13px] text-gray-200 overflow-x-auto m-0">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export default RefactoredCode;
