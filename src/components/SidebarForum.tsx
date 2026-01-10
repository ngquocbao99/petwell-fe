import React, { useEffect, useState } from "react";
import { Home, BookOpen, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { getForumStatistics } from "../utils/fetchFroumPost";

interface SidebarForumProps {
  activeCategory: string;
  onChangeCategory: (categoryId: string) => void;
}

const categories = [
  { id: "knowledge", name: "Knowledge", icon: BookOpen },
  { id: "forum", name: "General Forum", icon: Users },
];

const SidebarForum: React.FC<SidebarForumProps> = ({
  activeCategory,
  onChangeCategory,
}) => {
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalUsers: 0,
    newestUser: "Loading...",
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getForumStatistics();
        const data = res.data;
        setStats({
          totalPosts: data.totalPosts,
          totalUsers: data.totalUsers,
          newestUser: data.newestUser?.fullName || "Unknown",
        });
      } catch (err) {
        console.error("Error loading statistics:", err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="w-full md:w-64 shrink-0">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-4 py-3 bg-[#ffb366] text-white font-semibold">
          <h2 className="text-lg">Categories</h2>
        </div>
        <nav className="p-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onChangeCategory(category.id)}
              className={`w-full flex items-center gap-2 px-4 py-2 rounded-md my-1 ${
                activeCategory === category.id
                  ? "bg-[#fff0e0] text-[#a0522d] font-medium"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <category.icon className="w-5 h-5" />
              <span>{category.name}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 bg-[#fff8f0] border-t">
          <h3 className="font-medium text-gray-700 mb-2">Statistics</h3>
          <div className="text-sm text-gray-600">
            <div className="flex justify-between py-1">
              <span>Posts:</span>
              <span>{stats.totalPosts}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Members:</span>
              <span>{stats.totalUsers}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Newest member:</span>
              <span>{stats.newestUser}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SidebarForum;
