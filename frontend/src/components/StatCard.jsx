const StatCard = ({ title, value, icon: Icon }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm backdrop-blur sm:rounded-3xl sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-black uppercase tracking-wide text-slate-500 sm:text-sm sm:normal-case sm:tracking-normal">
            {title}
          </p>

          <h3 className="mt-1 text-2xl font-black text-slate-900 sm:mt-2 sm:text-3xl">
            {value ?? 0}
          </h3>
        </div>

        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-teal-600 to-sky-600 text-white shadow sm:h-12 sm:w-12 sm:rounded-2xl">
            <Icon size={18} className="sm:h-5.5 sm:w-5.5" />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
