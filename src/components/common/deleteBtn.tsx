import { Trash2 } from "lucide-react";

interface DeleteBtnProps {
  func: () => void;
}

const DeleteBtn: React.FC<DeleteBtnProps> = ({ func }) => {
  return (
    <button onClick={func} className="flex items-center bg-gray-400 p-2 rounded hover:cursor-pointer hover:bg-red-500 transition-[.25s]">
      <Trash2 color="white" size={16} />
    </button>
  );
};

export default DeleteBtn;
