export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { bootstrapSystem } = await import('@/system/lib/bootstrap');
    await bootstrapSystem();
  }
}
