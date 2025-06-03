import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import LoadingButton from '@mui/lab/LoadingButton';

import { Form, Field } from 'src/components/Hook-Form';
import { Iconify } from 'src/components/Iconify';

import { jwtDecode } from '/src/auth/context/jwt/utils';
import axios, { endpoints } from 'src/utils/axios';
import { useRouter } from 'src/routes/hooks/use-router';
import { signOut } from 'src/auth/context/jwt/action';

export const UpdateUserSchema = zod.object({
  first_name: zod.string().min(1, { message: 'First name is required!' }),
  last_name: zod.string().min(1, { message: 'Last name is required!' }),
});


export function AccountGeneral() {

  const router = useRouter();
  const decodedToken = jwtDecode(sessionStorage.getItem('access')) || {};

  const defaultValues = {
    first_name: decodedToken.first_name || '',
    last_name: decodedToken.last_name || '',
    email: decodedToken.email || '',
  };

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(UpdateUserSchema),
    defaultValues,
  });

  // 
  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods; 

  // Logout user and refresh the page and redirect to login page
  // TODO: add a snackbar to show the user that the user name has been updated
  const onSubmit = handleSubmit(async (data) => {
    try {
        await axios.patch(endpoints.auth.updateUser, data);
        await signOut();
        router.refresh();
    } catch (error) {
      console.error(error);
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Card sx={{ p: 3, gap: 3, display: 'flex', flexDirection: 'column' }}>
        <Box
          rowGap={3}
          columnGap={2}
          display="grid"
          gridTemplateColumns={{
            xs: 'repeat(1, 1fr)',
            sm: 'repeat(2, 1fr)',
          }}
        >
          <Field.Text name="first_name" label="First name" />
          <Field.Text name="last_name" label="Last name" />
        </Box>
        <Stack spacing={3} alignItems="flex-end" sx={{ mt: 3 }}>
          <Field.Text name="email" label="Email address" disabled={true} 
           helperText={
            <Stack component="span" direction="row" alignItems="center">
              <Iconify icon="eva:info-fill" width={16} sx={{ mr: 0.5 }} /> You cannot change your email address.
            </Stack>
          }/>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            Save changes
          </LoadingButton>
        </Stack>
      </Card>
    </Form>
  );
}
