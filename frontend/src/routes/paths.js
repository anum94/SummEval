const ROOTS = {
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
};

export const paths = {
  feedback: 'https://forms.gle/uvNj41qVYXQJLq4K8',
  page403: '/error/403',
  page404: '/error/404',
  page500: '/error/500',

  // AUTH
  auth: {
    jwt: {
      login: `${ROOTS.AUTH}/login`,
      register: `${ROOTS.AUTH}/register`,
    },
  },

  // DASHBOARD
  dashboard: {
    root: ROOTS.DASHBOARD,
  },

  // DASHBOARD/PROJECT
  project: {
    root: `${ROOTS.DASHBOARD}/project`,
  },
  // DASHBOARD/ACCOUNT
  account: {
    root: `${ROOTS.DASHBOARD}/account`,
  },
  documentation: {
    root: `${ROOTS.DASHBOARD}/documentation`,
  },
};
