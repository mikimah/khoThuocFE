import { RefreshCcw } from "lucide-react"

export default function ReloadBtn({func}) {
    return (
        <button
            onClick={func}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 hover:cursor-pointer transform hover:rotate-360 transition-all duration-500 ease-in-out"
        >
            <RefreshCcw size={20} />
        </button>
    )
}