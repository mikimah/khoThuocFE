import { SquarePen } from "lucide-react";

interface EditBtnProps {
  func: () => void;
}

const EditBtn: React.FC<EditBtnProps> = ({ func }) => {
  return (
    <button onClick={func} className="flex items-center bg-gray-400 p-2 rounded hover:cursor-pointer hover:bg-blue-500 transition-[.25s]">
      <SquarePen color="white" size={16} />
    </button>
  );
};

export default EditBtn;