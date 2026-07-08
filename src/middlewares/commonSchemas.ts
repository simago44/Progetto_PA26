import z from "zod";

// Check if Date contains only the Date part (YYYY-MM-DD)
const isDateOnly = (val: unknown): val is string =>
  typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val);

export const dateRangeSchema = z.object({
  fromDate: z.coerce.date().default(new Date(0)).refine(
    (date) => date <= new Date(), {
    message: "fromDate cannot be in the future"
  }),
  // We add midnight of the next day as the default time if time is missing
  toDate: z.preprocess(
    (val) => (isDateOnly(val) ? `${val}T23:59:59.999Z` : val),
    z.coerce.date().default(() => new Date())
  ),
}).refine((data) => data.toDate >= data.fromDate, {
  message: "toDate must be after fromDate",
  path: ["toDate"],
});
