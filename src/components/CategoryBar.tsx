import React from 'react';
import { 
  Sparkles, 
  Gamepad2, 
  Wrench, 
  MessageCircle, 
  Film, 
  Briefcase, 
  Camera, 
  BookMarked,
  Upload
} from 'lucide-react';
import { AppCategory, Language } from '../types';

interface Props {
  activeCategory: AppCategory;
  onSelectCategory: (cat: AppCategory) => void;
  language: Language;
  customUploadCount: number;
}

export const CategoryBar: React.FC<Props> = ({
  activeCategory,
  onSelectCategory,
  language,
  customUploadCount
}) => {
  const categories: { id: AppCategory; labelEn: string; labelMy: string; icon: React.ReactNode }[] = [
    { id: 'all', labelEn: 'All Apps', labelMy: 'အားလုံး', icon: <Sparkles size={15} /> },
    { id: 'games', labelEn: 'Games', labelMy: 'ဂိမ်းများ', icon: <Gamepad2 size={15} /> },
    { id: 'tools', labelEn: 'Tools & Utilities', labelMy: 'ဖုန်းသုံးကိရိယာများ', icon: <Wrench size={15} /> },
    { id: 'social', labelEn: 'Social & Chat', labelMy: 'လူမှုကွန်ရက်', icon: <MessageCircle size={15} /> },
    { id: 'entertainment', labelEn: 'Entertainment', labelMy: 'ဖျော်ဖြေရေး', icon: <Film size={15} /> },
    { id: 'productivity', labelEn: 'Productivity', labelMy: 'အလုပ်လုပ်ဆောင်မှု', icon: <Briefcase size={15} /> },
    { id: 'photography', labelEn: 'Photography', labelMy: 'ဓာတ်ပုံ/ဗီဒီယို', icon: <Camera size={15} /> },
    { id: 'myanmar', labelEn: 'Myanmar Special', labelMy: 'မြန်မာ အထူးအက်ပ်', icon: <BookMarked size={15} /> },
  ];

  return (
    <div className="w-full overflow-x-auto no-scrollbar py-2 mb-6">
      <div className="flex items-center gap-2 min-w-max">
        {categories.map((cat) => {
          const isSelected = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-600 dark:bg-emerald-500'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-750 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className={isSelected ? 'text-white' : 'text-slate-500 dark:text-slate-400'}>
                {cat.icon}
              </span>
              <span>{language === 'my' ? cat.labelMy : cat.labelEn}</span>
            </button>
          );
        })}

        {customUploadCount > 0 && (
          <button
            onClick={() => onSelectCategory('tools')} // or filter to uploaded
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
          >
            <Upload size={13} />
            <span>{customUploadCount} {language === 'my' ? 'တင်ထားသော APK' : 'User Uploaded'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
