import { useContext, useEffect, useMemo, useState } from 'react';

import Alert from '@mui/material/Alert';
import { useTheme } from '@mui/material/styles';

import { varAlpha, stylesMode } from 'src/theme/styles';

import { useSettingsContext } from 'src/components/Settings';

import { Main } from './main';
import { layoutClasses } from '../classes';
import { NavVertical } from './nav-vertical';
import { HeaderBase } from '../core/headerBase';

import { LayoutSection } from '../core/layoutSection';
import { getNavData as getDashboardNavData } from '../config-nav-dashboard';
import { ProjectsContext } from '../../ProjectsProvider.jsx';


export function DashboardLayout({ sx, children, data }) {
  const theme = useTheme();

  const { projects, setProjects } = useContext(ProjectsContext);

  const settings = useSettingsContext();

  const navColorVars = useNavColorVars(theme, settings);

  const layoutQuery = 'lg';

  const [navData, setNavData] = useState([]);

  useEffect(() => {
    data?.nav ?? setNavData(getDashboardNavData(projects));
  }, [projects]);

  return (
    <>
      <LayoutSection
        /** **************************************
         * Header
         *************************************** */
        headerSection={
          <HeaderBase
            layoutQuery={layoutQuery}
            slotsDisplay={{
              logo: false,
            }}
            slots={{
              topArea: (
                <Alert severity="info" sx={{ display: 'none', borderRadius: 0 }}>
                  This is an info Alert.
                </Alert>
              ),
            }}
            slotProps={{ container: { maxWidth: false } }}
          />
        }
        /** **************************************
         * Sidebar
         *************************************** */
        sidebarSection={
          <NavVertical data={navData} layoutQuery={layoutQuery} cssVars={navColorVars.section} />
        }
        /** **************************************
         * Footer
         *************************************** */
        footerSection={null}
        /** **************************************
         * Style
         *************************************** */
        cssVars={{
          ...navColorVars.layout,
          '--layout-transition-easing': 'linear',
          '--layout-transition-duration': '120ms',
          '--layout-nav-mini-width': '88px',
          '--layout-nav-vertical-width': '280px',
          '--layout-nav-horizontal-height': '64px',
          '--layout-dashboard-content-pt': theme.spacing(1),
          '--layout-dashboard-content-pb': theme.spacing(8),
          '--layout-dashboard-content-px': theme.spacing(5),
        }}
        sx={{
          [`& .${layoutClasses.hasSidebar}`]: {
            [theme.breakpoints.up(layoutQuery)]: {
              transition: theme.transitions.create(['padding-left'], {
                easing: 'var(--layout-transition-easing)',
                duration: 'var(--layout-transition-duration)',
              }),
              pl: 'var(--layout-nav-vertical-width)',
            },
          },
          ...sx,
        }}
      >
        <Main>{children}</Main>
      </LayoutSection>
    </>
  );
}



function useNavColorVars(theme) {
  const {
    vars: { palette },
  } = theme;

  return useMemo(() => {
    return {
      layout: {
        '--layout-nav-bg': palette.background.default,
        '--layout-nav-horizontal-bg': varAlpha(palette.background.defaultChannel, 0.8),
        '--layout-nav-border-color': varAlpha(palette.grey['500Channel'], 0.12),
        '--layout-nav-text-primary-color': palette.text.primary,
        '--layout-nav-text-secondary-color': palette.text.secondary,
        '--layout-nav-text-disabled-color': palette.text.disabled,
        [stylesMode.dark]: {
          '--layout-nav-border-color': varAlpha(palette.grey['500Channel'], 0.08),
          '--layout-nav-horizontal-bg': varAlpha(palette.background.defaultChannel, 0.96),
        },
      },
      section: {},
    };
  }, [
    palette.background.default,
    palette.background.defaultChannel,
    palette.common.white,
    palette.grey,
    palette.primary.light,
    palette.text.disabled,
    palette.text.primary,
    palette.text.secondary,
  ]);
}
