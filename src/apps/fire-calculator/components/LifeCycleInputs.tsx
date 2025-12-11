import React, { useState } from 'react';
import { LifeEvent } from '../engine/types';
import { Calendar, Plus, Trash2, Baby, ShieldCheck } from 'lucide-react';

interface Props {
  events: LifeEvent[];
  onAdd: (event: LifeEvent) => void;
  onRemove: (id: string) => void;
  currency: string;
}

const LifeCycleInputs: React.FC<Props> = ({ events, onAdd, onRemove, currency }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<LifeEvent>>({
    name: '',
    amount: 20000,
    startYear: new Date().getFullYear() + 5,
    endYear: new Date().getFullYear() + 20
  });

  const handleAdd = () => {
    if (newEvent.name && newEvent.amount !== undefined && newEvent.startYear && newEvent.endYear) {
      onAdd({
        id: Math.random().toString(36).substr(2, 9),
        name: newEvent.name,
        amount: newEvent.amount,
        startYear: newEvent.startYear,
        endYear: newEvent.endYear
      } as LifeEvent);
      setIsAdding(false);
      setNewEvent({
        name: '',
        amount: 20000,
        startYear: new Date().getFullYear() + 5,
        endYear: new Date().getFullYear() + 20
      });
    }
  };

  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2 text-indigo-400 font-semibold">
          <Calendar className="w-5 h-5" />
          <h2>Life-Cycle Events</h2>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          Add Event
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.map(event => (
          <div key={event.id} className="group bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 flex justify-between items-center hover:border-indigo-500/50 transition-all">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${event.amount > 0 ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                {event.amount > 0 ? <Baby className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-white">{event.name}</h3>
                <p className="text-xs text-slate-400">
                  {currency}{Math.abs(event.amount).toLocaleString()}/yr • {event.startYear} - {event.endYear}
                </p>
              </div>
            </div>
            <button
              onClick={() => onRemove(event.id)}
              className="p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        {events.length === 0 && !isAdding && (
          <div className="col-span-full py-8 text-center border-2 border-dashed border-slate-800 rounded-3xl">
            <p className="text-slate-500 text-sm">No life events added yet. Add things like "Kid Hump" or "Pension Floor".</p>
          </div>
        )}
      </div>

      {isAdding && (
        <div className="mt-6 p-6 bg-slate-800 rounded-3xl border border-indigo-500/30 animate-in fade-in slide-in-from-bottom-4">
          <h3 className="text-lg font-bold text-white mb-4">New Life Event</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs text-slate-400 mb-1 uppercase font-bold tracking-wider">Event Name</label>
              <input
                type="text"
                placeholder="e.g. Kid Hump"
                value={newEvent.name}
                onChange={e => setNewEvent({ ...newEvent, name: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 uppercase font-bold tracking-wider">Annual Amount ({currency})</label>
              <input
                type="number"
                placeholder="Positive for expense, negative for income"
                value={newEvent.amount}
                onChange={e => setNewEvent({ ...newEvent, amount: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 uppercase font-bold tracking-wider">Start Year</label>
              <input
                type="number"
                value={newEvent.startYear}
                onChange={e => setNewEvent({ ...newEvent, startYear: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1 uppercase font-bold tracking-wider">End Year</label>
              <input
                type="number"
                value={newEvent.endYear}
                onChange={e => setNewEvent({ ...newEvent, endYear: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsAdding(false)}
              className="px-6 py-2 text-slate-400 hover:text-white font-bold transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="px-8 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
            >
              Save Event
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default LifeCycleInputs;
