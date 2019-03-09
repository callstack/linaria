export type SerializableProperties = {
  [key: string]:
    | string
    | number
    | SerializableProperties
    | SerializableProperties[];
};

export default function isSerializable(
  o: any
): o is SerializableProperties | SerializableProperties[] {
  return (
    (Array.isArray(o) && o.every(isSerializable)) ||
    (typeof o === "object" && o != null && o.constructor.name === "Object")
  );
}
