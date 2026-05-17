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
      <span className='absolute right-3 top-2.5 text-gray-400'>🔍</span>
    </div>
  );
}
