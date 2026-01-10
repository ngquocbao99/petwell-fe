import { Edit2, Trash2, MoreVertical } from "lucide-react";

interface CommentMenuProps {
  commentId: string;
  content: string;
  onEdit: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  showMenu: boolean;
  onToggleMenu: () => void;
}

const CommentMenu: React.FC<CommentMenuProps> = ({
  commentId,
  content,
  onEdit,
  onDelete,
  showMenu,
  onToggleMenu,
}) => {
  return (
    <div className="relative ml-auto">
      <button
        className="p-1 hover:bg-gray-100 rounded-full"
        onClick={onToggleMenu}
      >
        <MoreVertical className="h-5 w-5 text-gray-500" />
      </button>
      {showMenu && (
        <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
          <div className="py-1">
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => {
                onEdit(commentId);
                onToggleMenu();
              }}
            >
              <Edit2 className="h-4 w-4" /> Edit
            </button>
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              onClick={() => {
                onDelete(commentId);
                onToggleMenu();
              }}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentMenu;
