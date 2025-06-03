import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { useTabs } from 'src/hooks/use-tabs';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/Iconify';
import { MyBreadcrumbs } from 'src/components/Breadcrumbs';

import { AccountGeneral } from './accountGeneral';
import { AccountChangePassword } from './accountSecurity';



const TABS = [
  { value: 'general', label: 'General', icon: <Iconify icon="solar:user-id-bold" width={24} /> },
  { value: 'security', label: 'Security', icon: <Iconify icon="ic:round-vpn-key" width={24} /> },
];


export function AccountView() {
  const tabs = useTabs('general');

  return (
    <DashboardContent>
      <MyBreadcrumbs
        heading="Account"
        links={[
          { },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Tabs value={tabs.value} onChange={tabs.onChange} sx={{ mb: { xs: 3, md: 5 } }}>
        {TABS.map((tab) => (
          <Tab key={tab.value} label={tab.label} icon={tab.icon} value={tab.value} />
        ))}
      </Tabs>

      {tabs.value === 'general' && <AccountGeneral />}

      {tabs.value === 'security' && <AccountChangePassword />}
    </DashboardContent>
  );
}
