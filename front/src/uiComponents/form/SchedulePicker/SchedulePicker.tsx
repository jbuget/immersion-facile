import { useField } from "formik";
import React from "react";
import {
  emptySchedule,
  reasonableSchedule,
  ScheduleDto,
} from "shared/src/schedule/ScheduleSchema";
import {
  calculateWeeklyHoursFromSchedule,
  checkSchedule,
  maxPermittedHoursPerWeek,
} from "shared/src/schedule/ScheduleUtils";
import { BoolRadioPicker } from "./BoolRadioPicker";
import { ComplexSchedulePicker } from "./ComplexSchedulePicker";
import "./SchedulePicker.css";
import { SimpleSchedulePicker } from "./SimpleSchedulePicker";
import { TotalHoursIndicator } from "./TotalHoursIndicator";

// Function that can be used as `validate` in Formik.
function scheduleValidator(value: ScheduleDto): string | void {
  const totalHours = calculateWeeklyHoursFromSchedule(value);

  if (totalHours > maxPermittedHoursPerWeek) {
    return "Veuillez saisir moins de 35h par semaine.";
  } else if (totalHours === 0) {
    return "Veuillez remplir les horaires!";
  }

  return checkSchedule(value);
}

type SchedulePickerProps = {
  name: string;
  setFieldValue: (schedule: ScheduleDto) => void;
  disabled?: boolean;
};

export const SchedulePicker = (props: SchedulePickerProps) => {
  const [field, meta] = useField<ScheduleDto>({
    name: props.name,
    validate: scheduleValidator,
  });

  return (
    <>
      <BoolRadioPicker
        name="schedule.isSimple"
        label="Les horaires quotidiens sont-ils réguliers ? *"
        description="Ex : (Non) chaque jour a des horaires bien spécifiques, (Oui) “Du lundi au vendredi de 8h00 à 17h00”"
        yesLabel="Oui"
        noLabel="Non, irréguliers"
        checked={field.value.isSimple}
        setFieldValue={(isSimple) => {
          props.setFieldValue(isSimple ? reasonableSchedule : emptySchedule);
        }}
        disabled={props.disabled}
      />

      <h4>
        {field.value.isSimple
          ? "Sélectionnez la période des jours *"
          : "Sélectionnez les horaires de travail jour par jour *"}
      </h4>

      {meta.error && (
        <div id={props.name + "-error-description"} className="fr-error-text">
          {meta.error}
        </div>
      )}
      <TotalHoursIndicator
        totalHours={calculateWeeklyHoursFromSchedule(field.value)}
      />

      {!field.value.isSimple && (
        <ComplexSchedulePicker
          selectedIndex={field.value.selectedIndex}
          {...props}
        />
      )}
      {field.value.isSimple && <SimpleSchedulePicker {...props} />}
    </>
  );
};
