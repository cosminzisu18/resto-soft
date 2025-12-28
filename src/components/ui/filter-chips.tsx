import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FilterChipsProps {
  options: { id: string; label: string }[];
  selected: string;
  onChange: (id: string) => void;
  className?: string;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  options,
  selected,
  onChange,
  className,
}) => {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => (
        <Button
          key={option.id}
          variant="pill"
          size="sm"
          data-active={selected === option.id}
          onClick={() => onChange(option.id)}
          className="px-4"
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
};

export default FilterChips;