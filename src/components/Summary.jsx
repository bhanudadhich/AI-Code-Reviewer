import React from "react";
import { FaRegFileLines } from "react-icons/fa6";
import { MdAutoAwesome } from "react-icons/md";

const Summary = ({ before, highlight, after }) => {
  return (
    <div className="summary relative p-[15px] rounded-lg bg-[#17192C] overflow-hidden">
      {/* title */}
      <div className="flex items-center gap-[10px]">
        <i className="text-[#818cf8] text-[20px]">
          <FaRegFileLines />
        </i>
        <h3 className="m-0 p-0 text-[#818cf8] text-[20px] font-[700]">
          Summary
        </h3>
      </div>

      {/* text */}
      <p className="m-0 mt-3 p-0 text-[15px] leading-relaxed text-gray-200 pr-[40px]">
        {before}{" "}
        <span className="text-[#ffb4ab] font-[700]">{highlight}</span>
        {after}
      </p>

      {/* peeche ki halki sparkle icon */}
      <i className="absolute top-[15px] right-[18px] text-[30px] text-white opacity-10">
        <MdAutoAwesome />
      </i>
    </div>
  );
};

export default Summary;