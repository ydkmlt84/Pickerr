export const handler = (): Response => {
  return new Response('Pickerr is alive', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
};
