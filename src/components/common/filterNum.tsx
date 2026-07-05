import { ListFilter,Circle,CircleCheck } from "lucide-react"
import { useState } from "react"


export default function FilterNum({itemList,func,filterValue}) {
  const [isOpen, setIsOpen] = useState(false);
  

  return (
    <button 
      className={`flex relative rounded-md items-center  px-2 gap-1 text-sm text-gray-500  hover:cursor-pointer hover:-translate-y-1 transition-all duration-500 ease-in-out  ${isOpen ? " bg-gray-300 text-white " : "hover:text-gray-700"}`}
      onClick={() => setIsOpen(!isOpen)}
    >
      <ListFilter size={20}/>
      {isOpen && <ul className="bg-gray-100 font-medium rounded-md absolute w-auto list-none top-[100%] right-0">
        {itemList.map(item => (
          <li key={item.value} onClick={()=>{func(item.value); setIsOpen(false)}} className="whitespace-nowrap text-right p-2 px-4 text-gray-500 hover:bg-gray-300 hover:text-white">
            {item.name} {filterValue == item.value ? <CircleCheck size={16} className="inline-block ml-1"/> : <Circle size={16} className="inline-block ml-1"/>}
          </li>
        ))}
      </ul>}
    </button>
  )
}