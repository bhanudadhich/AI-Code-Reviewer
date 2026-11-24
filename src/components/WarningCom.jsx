import React from "react";

const WarningCom = ({ data }) => {
  return (
    <div className="warningCom flex items-center justify-between p-[15px] rounded-lg bg-[#13151B] mb-2">
      <h3 className="text-[17px]">{data.title}</h3>

      <div className="px-[20px] py-[5px] rounded-md bg-[#34343D]">
        <p>Line {data.line}</p>
      </div>
    </div>
  );
};

export default WarningCom;