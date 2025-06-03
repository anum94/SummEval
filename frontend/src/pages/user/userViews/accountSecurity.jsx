import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

import { useBoolean } from 'src/hooks/use-boolean';

import { Iconify } from 'src/components/Iconify';
import { Form, Field } from 'src/components/Hook-Form';
import axios, { endpoints } from 'src/utils/axios';
import { useRouter } from 'src/routes/hooks/use-router';
import { signOut } from 'src/auth/context/jwt/action';


export const ChangePassWordSchema = zod
  .object({
    old_password: zod
      .string()
      .min(1, { message: ' Old Password is required!' })
      .min(6, { message: 'Old Password was be at least 6 characters!' }),
    new_password: zod
        .string()
        .min(1, { message: 'New password is required!' })
        .min(6, { message: 'Old Password was be at least 6 characters!' }),
    new_password2: zod
        .string()
        .min(1, { message: 'Confirm password required!' }),
  })
  .refine((data) => data.old_password !== data.new_password, {
    message: 'New password must be different than old password',
    path: ['new_password'],
  })
  .refine((data) => data.new_password === data.new_password2, {
    message: 'Passwords do not match!',
    path: ['new_password2'],
  });



export function AccountChangePassword() {
  const password = useBoolean();
  const router = useRouter();

  const defaultValues = { old_password: '', new_password: '', new_password2: '' };

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(ChangePassWordSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  // Logout user and refresh the page and redirect to login page
  //TODO: add a snackbar to show the user that the password was changed successfully
  const onSubmit = handleSubmit(async (data) => {
    try {
        await axios.post(endpoints.auth.changePassword, data);
        await signOut();
        router.refresh();
    } catch (error) {
      console.error(error);
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Card sx={{ p: 3, gap: 3, display: 'flex', flexDirection: 'column' }}>
        <Field.Text
          name="old_password"
          type={password.value ? 'text' : 'password'}
          label="Old password"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={password.onToggle} edge="end">
                  <Iconify icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Field.Text
          name="new_password"
          label="New password"
          type={password.value ? 'text' : 'password'}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={password.onToggle} edge="end">
                  <Iconify icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Field.Text
          name="new_password2"
          label="Confirm new password"
          type={password.value ? 'text' : 'password'}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={password.onToggle} edge="end">
                  <Iconify icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <LoadingButton type="submit" variant="contained" loading={isSubmitting} sx={{ ml: 'auto' }}>
          Save changes
        </LoadingButton>
      </Card>
    </Form>
  );
}
