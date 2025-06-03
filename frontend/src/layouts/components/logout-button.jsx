import { useCallback } from 'react';

import Button from '@mui/material/Button';

import { useRouter } from 'src/routes/hooks';

import { useAuthContext } from 'src/auth/hooks';
import { signOut } from 'src/auth/context/jwt/action';
import { Iconify } from 'src/components/Iconify';


export function LogoutButton({ ...other }) {
  const router = useRouter();

  const { checkUserSession } = useAuthContext();

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error(error);
    }
  }, [checkUserSession, router]);

  return (
    <Button
      fullWidth
      variant="soft"
      size="large"
      color="error"
      onClick={ handleLogout }
      {...other}
    >
      <Iconify icon="material-symbols:logout" sx={{ mr: 1 }} />
      Logout
    </Button>
  );
}
