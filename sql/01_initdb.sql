-- public.ships definition

-- Drop table

-- DROP TABLE public.ships;


CREATE TABLE public.ships (
	id serial4 NOT NULL,
	short_name varchar(255) NOT NULL,
	length float8 NOT NULL,
	mmsi int8 NOT NULL,
	CONSTRAINT ships_mmsi_key UNIQUE (mmsi),
	CONSTRAINT ships_pkey PRIMARY KEY (id)
);

-- public.pings definition

-- Drop table

-- DROP TABLE public.pings;

CREATE TABLE public.pings (
	id serial4 NOT NULL,
	"timestamp" timestamptz NOT NULL,
	lat float8 NOT NULL,
	lon float8 NOT NULL,
	mmsi int8 NOT NULL,
	CONSTRAINT pings_pkey PRIMARY KEY (id),
	CONSTRAINT pings_mmsi_fkey FOREIGN KEY (mmsi) REFERENCES public.ships(mmsi) ON DELETE CASCADE ON UPDATE CASCADE
);
