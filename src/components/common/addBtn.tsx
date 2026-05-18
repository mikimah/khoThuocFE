export default function AddBtn({ func, placeholder }) {
  return (
    <button
      onClick={func}
      className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition hover:cursor-pointer'
    >
      {placeholder}
    </button>
  );
}
