export const createEntryPoint = (
  name: string,
  code: string,
  only = ['__linariaPreval']
) => ({
  name,
  code,
  only,
});
