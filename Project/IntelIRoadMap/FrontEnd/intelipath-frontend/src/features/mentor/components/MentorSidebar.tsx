import { 
  SquaresFour, 
  FolderOpen, 
  ChartLineUp, 
  ChatTeardropText, 
  TrendUp,
  Robot,
  User,
  BookOpen
} from "@phosphor-icons/react";

type MentorSidebarProps = {
  activeTab: string;
  onTabChange: (tab: string) => void;
};

export function MentorSidebar({ activeTab, onTabChange }: MentorSidebarProps) {
  const mainNav = [
    { id: "dashboard", label: "Dashboard", icon: SquaresFour },
    { id: "courses", label: "Courses", icon: BookOpen },
    { id: "portfolios", label: "E-Portfolios", icon: FolderOpen },
    { id: "progress", label: "Progress reports", icon: ChartLineUp },
    { id: "feedback", label: "My feedback", icon: ChatTeardropText },
  ];

  const toolsNav = [
    { id: "market", label: "Market trends", icon: TrendUp },
    { id: "aichat", label: "AI chat", icon: Robot },
  ];

  const accountNav = [
    { id: "profile", label: "Profile", icon: User },
  ];

  const renderNavGroup = (items: typeof mainNav) => (
    <nav className="flex flex-col gap-1.5">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-[14px] font-bold transition-all duration-300 ${
              isActive
                ? "bg-white text-slate-900 shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-slate-100"
                : "text-slate-500 hover:bg-white/60 hover:text-slate-900"
            }`}
          >
            <Icon size={20} weight={isActive ? "fill" : "regular"} />
            {item.label}
          </button>
        );
      })}
    </nav>
  );

  return (
    <aside className="w-[260px] shrink-0 flex flex-col h-full overflow-y-auto px-4 py-8 bg-transparent">
      <div className="flex-1 flex flex-col gap-8">
        <div>{renderNavGroup(mainNav)}</div>
        
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3 px-4">
            Tools
          </h4>
          {renderNavGroup(toolsNav)}
        </div>

        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-3 px-4">
            Account
          </h4>
          {renderNavGroup(accountNav)}
        </div>
      </div>
    </aside>
  );
}
