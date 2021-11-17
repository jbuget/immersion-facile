CREATE TABLE public.immersion_applications (
    id uuid PRIMARY KEY,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    status varchar(255) NOT NULL,
    email varchar(255) NOT NULL,
    first_name varchar(255) NOT NULL,
    last_name varchar(255) NOT NULL,
    phone varchar(255),
    agency_id uuid NOT NULL,
    date_submission timestamp without time zone NOT NULL,
    date_start timestamp without time zone NOT NULL,
    date_end timestamp without time zone NOT NULL,
    siret char(14) NOT NULL,
    business_name varchar(255) NOT NULL,
    mentor varchar(255) NOT NULL,
    mentor_phone varchar(255) NOT NULL,
    mentor_email varchar(255) NOT NULL,
    schedule jsonb NOT NULL,
    individual_protection boolean NOT NULL,
    sanitary_prevention boolean NOT NULL,
    sanitary_prevention_description varchar(255),
    immersion_address varchar(255),
    immersion_objective varchar(255),
    immersion_profession varchar(255) NOT NULL,
    immersion_activities varchar(255) NOT NULL,
    immersion_skills varchar(255),
    beneficiary_accepted boolean NOT NULL,
    enterprise_accepted boolean NOT NULL
);

-- Automatically update the immersion_applications column on any row change.

CREATE OR REPLACE FUNCTION public.update_immersion_applications_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_immersion_applications_updated_at BEFORE UPDATE
  ON public.immersion_applications FOR EACH ROW EXECUTE PROCEDURE
  public.update_immersion_applications_updated_at_column();
