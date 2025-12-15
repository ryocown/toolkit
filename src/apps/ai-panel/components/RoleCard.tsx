import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Role, Opinion } from '../types';

interface RoleCardProps {
  role: Role;
  opinions: Opinion[];
}

export const RoleCard = ({ role, opinions }: RoleCardProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const RoleIcon = role.icon;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-4 ${role.bg} border-b border-slate-100 transition-colors hover:opacity-90`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-white shadow-sm ${role.color}`}>
            <RoleIcon size={20} />
          </div>
          <h3 className="font-bold text-slate-800">{role.title}</h3>
        </div>
        {isOpen ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
      </button>

      {isOpen && (
        <div className="p-4 grid gap-4 md:grid-cols-2">
          {opinions.map((op, idx) => (
            <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-100 relative">
              <div className="absolute top-3 right-3 text-xs font-mono px-2 py-1 bg-white border border-slate-200 rounded text-slate-500">
                {op.modelName}
              </div>
              <p className="font-semibold text-sm text-slate-700 mb-1">{op.personaName}</p>
              <p className="text-xs text-slate-500 italic mb-3">{op.bio}</p>
              <p className="text-sm text-slate-800 leading-relaxed">{op.opinion}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
