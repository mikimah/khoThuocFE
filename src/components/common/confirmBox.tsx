interface ConfirmDialogProps {
  message: string;
  title?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function ConfirmBox({
  message,
  title = "Xác nhận",
  onConfirm,
  onCancel,
  confirmText = "Xóa",
  cancelText = "Hủy",
}: ConfirmDialogProps) {
  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
      <div className='bg-white p-6 rounded-xl shadow-lg w-96 animate-in fade-in zoom-in-95 duration-200'>
        <h3 className='text-lg font-bold text-gray-800 mb-2'>{title}</h3>
        <p className='text-gray-600 mb-6'>{message}</p>

        <div className='flex justify-end gap-3'>
          <button
            onClick={onCancel}
            className='px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition'
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className='px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition'
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}