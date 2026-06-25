const IDENTITY_URL = import.meta.env.IDENTITY_URL ?? '';

export async function verifyAuth(request: Request): Promise<boolean> {
    if (import.meta.env.DEV) return true;

    const header = request.headers.get('Authorization');
    if (!header?.startsWith('Bearer ')) return false;
    if (!IDENTITY_URL) return false;

    try {
        const response = await fetch(`${IDENTITY_URL}/user`, {
            headers: { Authorization: header },
        });

        return response.ok;
    } catch {
        return false;
    }
}
