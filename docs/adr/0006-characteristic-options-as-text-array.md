# Characteristic options stored as text array

Multiple-choice Características store their selectable options as a `text[]` column on the `characteristics` row rather than in a separate `characteristic_options` table. The options list for any given Característica is small, order doesn't require persistence beyond the array index, and no option needs independent identity or metadata. A separate table would add a join and a migration cost with no benefit at this scale.
