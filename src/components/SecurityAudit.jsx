import React from "react";

const SecurityAudit = ({ data }) => {
  return (
    <div className="flex-1 p-[15px] rounded-lg bg-[#12121B] border border-gray-700">
      <p className="text-gray-400 text-[13px]">{data.name}</p>
      <h3 className="text-[20px] font-[700] text-white">{data.value}</h3>
    </div>
  );
};

export default SecurityAudit;
