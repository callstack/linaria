export default function makeStyles<Slots extends string | number>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  stylesBySlots: Record<Slots, unknown>
): () => Record<Slots, string> {
  throw new Error('Cannot be called in runtime');
}
