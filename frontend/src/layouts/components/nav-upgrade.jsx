import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { Iconify } from 'src/components/Iconify';

import { jwtDecode } from '/src/auth/context/jwt/utils';
import { LogoutButton } from 'src/layouts/components/logout-button';
import { DocumentationButton } from './documentation-button';
import { paths } from '/src/routes/paths';

export function NavUpgrade({ sx, ...other }) {
  const decodedToken = jwtDecode(sessionStorage.getItem('access'));

  return (
    <Stack sx={{ px: 2, py: 5, textAlign: 'center', ...sx }} {...other}>
      <Stack spacing={0.5} sx={{ mb: 2, mt: 1.5, width: 1 }} alignItems="center">
        <Button fullWidth variant="soft" size="large" color="common" href={paths.account.root}>
          <Iconify icon="solar:settings-outline" sx={{ mr: 1 }} />
          Account settings
        </Button>
        <DocumentationButton/>
        <LogoutButton />
      </Stack>
    </Stack>
  );
}
