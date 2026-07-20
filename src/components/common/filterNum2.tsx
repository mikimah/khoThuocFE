import { ListFilter, Circle, CircleCheck } from "lucide-react";
import { useState } from "react";

export default function FilterNum2({ itemTitle, itemList, func, filterValue }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <button
      className={`flex relative rounded-md items-center  p-2 gap-1 text-sm text-gray-500  hover:cursor-pointer   ${isOpen ? " bg-gray-300 text-white " : "hover:text-gray-700"}`}
      onClick={() => setIsOpen(!isOpen)}
    >
      <ListFilter
        size={20}
        className='hover:-translate-y-1 transition-all duration-500 ease-in-out'
      />
      {isOpen && (
        <div className="bg-gray-100 font-medium rounded-md absolute w-auto list-none top-[100%] right-0 flex">
          {itemTitle.map((title, index) => (
            <div key={index} className="p-2 whitespace-nowrap text-gray-500 font-bold">
              {title}
              <hr className="mt-2"/>
              <div>
                {itemList[index].map((item) => (
                  <div key={item.value} onClick={() =>{ func[index](item.value); }} className="p-2 font-medium text-right hover:bg-gray-300 whitespace-nowrap text-gray-500 hover:bg-gray-300 hover:text-white">
                    {item.name} {filterValue[index] == item.value ? <CircleCheck size={16} className="inline-block ml-1"/> : <Circle size={16} className="inline-block ml-1"/>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </button>
  );
}
