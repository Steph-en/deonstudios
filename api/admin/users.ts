import { HttpError, readJson, requireStaff, route, sendJson, serviceClient } from '../_lib/http.js';

/**
 * Admin-only team management. Uses the Supabase service role, which must never
 * reach the browser, so account creation/removal lives here instead of the client.
 *
 *   POST   /api/admin/users          { email, username?, password, full_name, role }
 *   DELETE /api/admin/users?id=<uuid>
 */

const ROLES = ['admin', 'manager', 'editor'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-z0-9._-]{2,40}$/;

export default route(async (req, res) => {
  const { userId } = await requireStaff(req, { admin: true });
  const db = serviceClient();

  if (req.method === 'POST') {
    const body = await readJson<Record<string, unknown>>(req);
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    const fullName = String(body.full_name ?? '').trim();
    const role = String(body.role ?? '');
    const username = String(body.username || email.split('@')[0]).trim().toLowerCase();

    if (!EMAIL_RE.test(email) || email.length > 320) throw new HttpError(400, 'Enter a valid email address.');
    if (password.length < 8 || password.length > 72) throw new HttpError(400, 'Password must be 8-72 characters.');
    if (!fullName || fullName.length > 200) throw new HttpError(400, 'Full name is required.');
    if (!ROLES.includes(role)) throw new HttpError(400, 'Invalid role.');
    if (!USERNAME_RE.test(username)) {
      throw new HttpError(400, 'Username may only use letters, numbers, dots, dashes and underscores (2-40 characters).');
    }

    const { data: created, error: createError } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, username }, // display only; never used for authorization
    });
    if (createError || !created.user) {
      const exists = /already|registered|exists/i.test(createError?.message ?? '');
      throw new HttpError(exists ? 409 : 400, exists ? `An account for ${email} already exists.` : createError?.message ?? 'Could not create user.');
    }

    // The role lives ONLY in public.profiles, written here with the service role.
    const { error: profileError } = await db
      .from('profiles')
      .insert({ id: created.user.id, email, username, full_name: fullName, role });
    if (profileError) {
      await db.auth.admin.deleteUser(created.user.id); // roll back so no role-less account is left behind
      const taken = /duplicate|unique/i.test(profileError.message);
      throw new HttpError(taken ? 409 : 500, taken ? `The username "${username}" is already taken.` : 'Could not create the profile.');
    }
    return sendJson(res, 201, { success: true, id: created.user.id });
  }

  if (req.method === 'DELETE') {
    const id = new URL(req.url ?? '', 'http://localhost').searchParams.get('id') ?? '';
    if (!/^[0-9a-f-]{36}$/i.test(id)) throw new HttpError(400, 'A valid user id is required.');
    if (id === userId) throw new HttpError(400, 'You cannot remove your own account.');

    const { data: target } = await db.from('profiles').select('role').eq('id', id).maybeSingle();
    if (target?.role === 'admin') {
      const { count } = await db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'admin');
      if ((count ?? 0) <= 1) throw new HttpError(400, 'You cannot remove the last administrator.');
    }

    const { error } = await db.auth.admin.deleteUser(id); // profile row is removed by ON DELETE CASCADE
    if (error) throw new HttpError(400, error.message);
    return sendJson(res, 200, { success: true });
  }

  res.setHeader('Allow', 'POST, DELETE');
  throw new HttpError(405, 'Method not allowed.');
});
