import { z as zod } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from '/src/routes/paths';
import { useRouter } from '/src/routes/hooks';
import { RouterLink } from '/src/routes/components';

import { useBoolean } from '/src/hooks/use-boolean';

import { Iconify } from '/src/components/Iconify';
import { Form, Field } from '/src/components/Hook-Form';

import { signUp } from '/src/auth/context/jwt';
import { useAuthContext } from '/src/auth/hooks';

// ----------------------------------------------------------------------

export const SignUpSchema = zod.object({
  firstName: zod.string().min(1, { message: 'First name is required!' }),
  lastName: zod.string().min(1, { message: 'Last name is required!' }),
  email: zod
    .string()
    .min(1, { message: 'Email is required!' })
    .email({ message: 'Email must be a valid email address!' }),
  password: zod
    .string()
    .min(1, { message: 'Password is required!' })
    .min(6, { message: 'Password must be at least 6 characters!' }),
  password2: zod
    .string()
    .min(1, { message: 'Password is required!' })
    .min(6, { message: 'Password must be at least 6 characters!' }),
}).superRefine(({ password2, password }, ctx) => {
  if (password2 !== password) {
    ctx.addIssue({
      code: "custom",
      message: "The passwords did not match",
      path: ['password2']
    });
  }
});

export function JwtRegisterView() {
  const { checkUserSession } = useAuthContext();

  const router = useRouter();

  const password = useBoolean();

  const [errorMsg, setErrorMsg] = useState('');

  const defaultValues = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    password2: '',
  };

  const methods = useForm({
    resolver: zodResolver(SignUpSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await signUp({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        password: data.password,
        password2: data.password2,
      });
      await checkUserSession?.(); // check if user is authenticated

      router.refresh();
    } catch (error) {
      console.error(error);
      setErrorMsg(error instanceof Error ? error.message : error);
    }
  });

  const renderHead = (
    <Stack spacing={1.5} sx={{ mb: 5 }}>
      <Typography variant="h5">Get started absolutely free</Typography>

      <Stack direction="row" spacing={0.5}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Already have an account?
        </Typography>

        <Link component={RouterLink} href={paths.auth.jwt.login} variant="subtitle2">
          Login
        </Link>
      </Stack>
    </Stack>
  );

  const renderForm = (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Field.Text
          name="firstName"
          label="First name"
          placeholder="John"
          InputLabelProps={{ shrink: true }}
        />
        <Field.Text
          name="lastName"
          label="Last name"
          placeholder="Doe"
          InputLabelProps={{ shrink: true }}
        />
      </Stack>

      <Field.Text
        name="email"
        label="Email address"
        placeholder="john.doe@example.com"
        InputLabelProps={{ shrink: true }}
      />

      <Field.Text
        name="password"
        label="Password"
        placeholder="Choose a strong password"
        type={password.value ? 'text' : 'password'}
        InputLabelProps={{ shrink: true }}
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
        name="password2"
        label="Confirm Password"
        placeholder="Please confirm your password"
        type={password.value ? 'text' : 'password'}
        InputLabelProps={{ shrink: true }}
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

      <LoadingButton
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator="Create account..."
      >
        Create Account
      </LoadingButton>
    </Stack>
  );

  return (
    <>
      {renderHead}

      {!!errorMsg && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMsg}
        </Alert>
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm}
      </Form>
    </>
  );
}
