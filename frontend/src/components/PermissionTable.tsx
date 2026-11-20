import React from 'react';

export interface ModulePermission {
  key: string;
  name: string;
  actions: string[]; // e.g. ['V', 'A', 'E', 'D']
}

interface PermissionTableProps {
  permissions: ModulePermission[];
  onChange: (updated: ModulePermission[]) => void;
  disabled?: boolean;
}

export const PermissionTable: React.FC<PermissionTableProps> = ({
  permissions,
  onChange,
  disabled = false,
}) => {
  const handleSelectAllRow = (key: string, checked: boolean) => {
    const next = permissions.map((item) => {
      if (item.key === key) {
        return {
          ...item,
          actions: checked ? ['V', 'A', 'E', 'D'] : [],
        };
      }
      return item;
    });
    onChange(next);
  };

  const handleActionChange = (key: string, action: 'V' | 'A' | 'E' | 'D', checked: boolean) => {
    const next = permissions.map((item) => {
      if (item.key !== key) return item;

      let currentActions = new Set(item.actions);

      if (action === 'V') {
        if (!checked) {
          currentActions.clear();
        } else {
          currentActions.add('V');
        }
      } else {
        if (checked) {
          currentActions.add(action);
          currentActions.add('V');
        } else {
          currentActions.delete(action);
        }
      }

      return {
        ...item,
        actions: Array.from(currentActions),
      };
    });
    onChange(next);
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 touch-scroll">
      <table className="w-full text-left text-xs min-w-[550px]">
        <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th className="py-3 px-4">Module / Page</th>
            <th className="py-3 px-3 text-center">Select All</th>
            <th className="py-3 px-3 text-center">View (V)</th>
            <th className="py-3 px-3 text-center">Add (A)</th>
            <th className="py-3 px-3 text-center">Edit (E)</th>
            <th className="py-3 px-3 text-center">Delete (D)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-800 dark:text-slate-200">
          {permissions.map((p) => {
            const hasV = p.actions.includes('V');
            const hasA = p.actions.includes('A');
            const hasE = p.actions.includes('E');
            const hasD = p.actions.includes('D');
            const isAllSelected = hasV && hasA && hasE && hasD;

            return (
              <tr key={p.key} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition">
                <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                  {p.name}
                  <span className="block text-[10px] font-mono font-normal text-slate-400 dark:text-slate-500">{p.key}</span>
                </td>

                <td className="py-3 px-3 text-center">
                  <input
                    type="checkbox"
                    disabled={disabled}
                    checked={isAllSelected}
                    onChange={(e) => handleSelectAllRow(p.key, e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-indigo-500 cursor-pointer"
                  />
                </td>

                <td className="py-3 px-3 text-center">
                  <input
                    type="checkbox"
                    disabled={disabled}
                    checked={hasV}
                    onChange={(e) => handleActionChange(p.key, 'V', e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-blue-500 cursor-pointer"
                  />
                </td>

                <td className="py-3 px-3 text-center">
                  <input
                    type="checkbox"
                    disabled={disabled}
                    checked={hasA}
                    onChange={(e) => handleActionChange(p.key, 'A', e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-emerald-500 cursor-pointer"
                  />
                </td>

                <td className="py-3 px-3 text-center">
                  <input
                    type="checkbox"
                    disabled={disabled}
                    checked={hasE}
                    onChange={(e) => handleActionChange(p.key, 'E', e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-amber-500 cursor-pointer"
                  />
                </td>

                <td className="py-3 px-3 text-center">
                  <input
                    type="checkbox"
                    disabled={disabled}
                    checked={hasD}
                    onChange={(e) => handleActionChange(p.key, 'D', e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 focus:ring-rose-500 cursor-pointer"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
