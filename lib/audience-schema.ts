import { z } from "zod";

export const audienceSchema = z.object({
  type: z.enum(["everyone", "all_members", "good_standing", "overdue", "expiring", "pending", "department", "event_registrants", "event_unpaid", "event_absent", "subscribers"]),
  id: z.string().optional(),
});
