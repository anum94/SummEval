import Alert from '@mui/material/Alert';

import { stylesMode } from 'src/theme/styles';

import { Main } from './main';
import { HeaderBase } from '../core/headerBase';
import { LayoutSection } from '../core/layoutSection';

export function AuthCenteredLayout({ sx, children }) {

  const layoutQuery = 'md';

  return (
    <LayoutSection
      
      // Header
      headerSection={
        <HeaderBase
          layoutQuery={layoutQuery}
          slotsDisplay={{
            helpLink: true,
          }}
          slots={{
            topArea: (
              <Alert severity="info" sx={{ display: 'none', borderRadius: 0 }}>
                This is an info Alert.
              </Alert>
            ),
          }}
          slotProps={{ container: { maxWidth: false } }}
          sx={{ position: { [layoutQuery]: 'fixed' } }}
        />
      }
      
      // Footer
      footerSection={null}
      
      // Style
      cssVars={{
        '--layout-auth-content-width': '420px',
      }}
      sx={{
        '&::before': {
          width: 1,
          height: 1,
          zIndex: 1,
          content: "''",
          opacity: 0.24,
          position: 'fixed',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center',
          [stylesMode.dark]: { opacity: 0.08 },
        },
        ...sx,
      }}
    >
      <Main layoutQuery={layoutQuery}>{children}</Main>
    </LayoutSection>
  );
}
