import React, { ChangeEvent } from "react";

const weekdays = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche",
];

type WeekdayDropdownProps = {
  name: string;
  minDay: number;
  maxDay: number;
  selected: number;
  onValueChange: (pickedDay: number) => void;
};
export const WeekdayDropdown = ({
  name,
  minDay,
  maxDay,
  selected,
  onValueChange,
}: WeekdayDropdownProps) => {
  const onChangeHandler = (evt: ChangeEvent) => {
    const target = evt.currentTarget as HTMLSelectElement;
    onValueChange(Number(target.value));
  };

  return (
    <select
      className="fr-select"
      id={name}
      name={name}
      value={selected}
      onChange={onChangeHandler}
    >
      {weekdays
        .filter((_, index) => index >= minDay && index <= maxDay)
        .map((day, index) => (
          <option value={index + minDay} key={name + day}>
            {day}
          </option>
        ))}
    </select>
  );
};