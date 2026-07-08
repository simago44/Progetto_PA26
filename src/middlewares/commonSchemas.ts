import z from "zod";

export const dateRangeSchema = z.object({
  fromDate: z.coerce.date().default(new Date(0)).refine(
    (date) => date <= new Date(), {
    message: "fromDate cannot be in the future"
  }),
  toDate: z.coerce.date().default(() => new Date())
}).refine((data) => data.toDate >= data.fromDate, {
  message: "toDate must be after fromDate",
  path: ["toDate"],
});
