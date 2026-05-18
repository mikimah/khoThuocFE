import { Search } from "lucide-react";

export default function SearchInput({ searchValue, func, placeholder }) {
  return (
    <div className='relative'>
      <input
        value={searchValue}
        onChange={(e) => func(e.target.value)}
        type='text'
        placeholder={placeholder}
        className='pl-4 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none w-64 text-sm'
      />
      <span className='absolute right-3 top-[45%] transform -translate-y-1/2 text-gray-400'>
        <Search className="inline-block w-5 h-5" />
      </span>
    </div>
  );
}
