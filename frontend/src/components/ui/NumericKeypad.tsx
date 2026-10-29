import React from 'react';
import { Delete, Check } from 'lucide-react';

interface NumericKeypadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
}

export const NumericKeypad: React.FC<NumericKeypadProps> = ({
  onDigit,
  onBackspace,
  onClear,
  onSubmit,
  submitLabel = 'Enter',
  submitDisabled = false,
}) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'DEL'];

  return (
    <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
      {keys.map((k) => {
        if (k === 'C') {
          return (
            <button
              key={k}
              type="button"
              onClick={onClear}
              className="h-12 sm:h-14 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 font-bold text-lg border border-rose-200 transition-all flex items-center justify-center select-none shadow-xs"
            >
              C
            </button>
          );
        }
        if (k === 'DEL') {
          return (
            <button
              key={k}
              type="button"
              onClick={onBackspace}
              className="h-12 sm:h-14 rounded-xl bg-[#F0F4EC] hover:bg-[#E3E8DE] active:scale-95 text-[#5E7568] hover:text-[#0A3420] font-bold text-lg border border-[#DCE4D6] transition-all flex items-center justify-center select-none shadow-xs"
            >
              <Delete className="w-5 h-5" />
            </button>
          );
        }
        return (
          <button
            key={k}
            type="button"
            onClick={() => onDigit(k)}
            className="h-12 sm:h-14 rounded-xl bg-[#F0F4EC] hover:bg-[#E3E8DE] active:scale-95 text-[#0A3420] font-extrabold text-xl border border-[#DCE4D6] shadow-xs transition-all flex items-center justify-center select-none"
          >
            {k}
          </button>
        );
      })}

      {onSubmit && (
        <button
          type="button"
          disabled={submitDisabled}
          onClick={onSubmit}
          className="col-span-3 h-12 sm:h-14 mt-1 rounded-xl bg-[#6D2430] hover:bg-[#581B25] active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm sm:text-base shadow-lg shadow-[#6D2430]/20 transition-all flex items-center justify-center gap-2 select-none"
        >
          <Check className="w-5 h-5" />
          <span>{submitLabel}</span>
        </button>
      )}
    </div>
  );
};
