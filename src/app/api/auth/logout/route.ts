import { SESSION_COOKIE } from '@/lib/auth';
import { COOKIE_PATH, redirectTo } from '@/lib/app-url';

export async function POST() {
  const res = redirectTo('/login', 303);
  res.cookies.delete({ name: SESSION_COOKIE, path: COOKIE_PATH });
  return res;
}
