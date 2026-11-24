import React from "react";
import { HiOutlineLightBulb } from "react-icons/hi";

const ProTip = ({ data }) => {
  return (
    <div className="p-[15px] bg-[#101019] rounded-[10px] border-l-[5px] border-l-[#6366f1]">
      <div className="flex items-center gap-[15px]">
        <i className="text-[17px] text-[#6366f1]">
          <HiOutlineLightBulb />
        </i>
        <p className="font-[700] text-[16px]">{data.title}</p>
      </div>
      <p className="text-[14px] text-gray-400 mt-2">{data.text}</p>
    </div>
  );
};

export default ProTip;
